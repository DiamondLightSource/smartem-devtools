#!/usr/bin/env python3
"""Slice markdown docs into content atoms for reality-verification.

Deterministic structural slicer: walks each markdown file and emits one JSON
record per structural block (prose run, fenced code block, table, diagram,
bare section heading, frontmatter). The semantic layer (claim extraction +
comparison against the codebase) is a separate downstream pass; this script
only produces reproducible, line-anchored atoms with stable ids.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path

FENCE_RE = re.compile(r"^(\s*)(```+|~~~+)(.*)$")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
TABLE_SEP_RE = re.compile(r"^\s*\|?[\s:]*-{2,}[\s:|-]*\|?\s*$")
IMAGE_RE = re.compile(r"^\s*!\[[^\]]*\]\([^)]+\)\s*$")

# oracle hints: how a downstream pass would go about checking this atom
HINT_RULES = [
    ("env-var", re.compile(r"`?[A-Z][A-Z0-9_]{3,}`?\s*=|\b[A-Z][A-Z0-9_]{3,}\b\s*(?:env|variable)")),
    ("port", re.compile(r":\d{4,5}\b|\bport\b|NodePort", re.I)),
    ("source-path", re.compile(r"[\w./-]+\.(?:py|ts|tsx|js|sh|ya?ml|json|toml|cfg|ini|sql|md)\b")),
    ("url", re.compile(r"https?://")),
    ("cli-cmd", re.compile(r"^\s*[\$#>]\s|\b(?:npm|python|pytest|kubectl|helm|docker|alembic|ruff|pyright|gh|git|uv|pip)\b")),
    ("k8s", re.compile(r"\bk8s\b|kubernetes|kubectl|helm|namespace|sealed[- ]?secret", re.I)),
]

KIND_BY_DIR = {
    "getting-started": "tutorial",
    "operations": "howto",
    "development": "howto",
    "backend": "reference",
    "agent": "reference",
    "athena": "reference",
    "architecture": "explanation",
    "api": "reference",
}


def doc_kind(rel: str) -> str:
    parts = rel.split("/")
    if "decisions" in parts and rel.endswith(".md") and re.search(r"/\d{4}-", rel):
        return "adr"
    if parts[0] == "docs" and len(parts) > 1:
        top = parts[1]
        if top == "decision-records":
            return "explanation"
        return KIND_BY_DIR.get(top, "reference")
    return "reference"


def sha(text: str) -> str:
    return hashlib.sha1(text.strip().encode("utf-8")).hexdigest()[:10]


def hints(text: str) -> list[str]:
    return [name for name, rx in HINT_RULES if rx.search(text)]


@dataclass
class Atom:
    id: str
    sha1: str
    file: str
    doc_kind: str
    type: str  # prose | code | table | diagram | section | frontmatter
    heading_path: list[str]
    lang: str | None
    line_start: int
    line_end: int
    n_lines: int
    n_chars: int
    oracle: list[str]
    content: str
    verify: dict | None = None  # filled by downstream reality-comparison pass


def atomize(path: Path, root: Path) -> list[Atom]:
    rel = str(path.relative_to(root))
    kind = doc_kind(rel)
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    n = len(lines)
    atoms: list[Atom] = []
    heading_stack: list[tuple[int, str]] = []  # (level, title)
    ordinal = 0
    i = 0

    def hpath() -> list[str]:
        return [t for _, t in heading_stack]

    def emit(atype: str, s: int, e: int, body: list[str], lang: str | None = None) -> None:
        nonlocal ordinal
        text = "\n".join(body)
        if atype != "section" and not text.strip():
            return
        atoms.append(
            Atom(
                id=f"{rel}::a{ordinal:03d}",
                sha1=sha(text or "|".join(hpath())),
                file=rel,
                doc_kind=kind,
                type=atype,
                heading_path=hpath(),
                lang=lang,
                line_start=s + 1,
                line_end=e + 1,
                n_lines=e - s + 1,
                n_chars=len(text),
                oracle=hints(text),
                content=text,
            )
        )
        ordinal += 1

    # optional YAML frontmatter
    if lines and lines[0].strip() == "---":
        for j in range(1, n):
            if lines[j].strip() == "---":
                emit("frontmatter", 0, j, lines[0 : j + 1])
                i = j + 1
                break

    pending_heading_needs_body = False  # true right after a heading, until we see body

    while i < n:
        line = lines[i]
        fence = FENCE_RE.match(line)
        heading = HEADING_RE.match(line)

        if heading:
            # a heading with no body between it and the next heading -> section atom
            if pending_heading_needs_body:
                lvl, title = heading_stack[-1]
                emit("section", heading_stack_line[0], heading_stack_line[0], [f"{'#'*lvl} {title}"])
            level = len(heading.group(1))
            title = heading.group(2).strip()
            while heading_stack and heading_stack[-1][0] >= level:
                heading_stack.pop()
            heading_stack.append((level, title))
            heading_stack_line = (i,)
            pending_heading_needs_body = True
            i += 1
            continue

        if fence:
            marker = fence.group(2)[0]
            lang = fence.group(3).strip().split()[0] if fence.group(3).strip() else None
            s = i
            i += 1
            while i < n and not re.match(rf"^\s*{re.escape(marker)}{{{len(fence.group(2))},}}\s*$", lines[i]):
                i += 1
            e = min(i, n - 1)
            body = lines[s : e + 1]
            atype = "diagram" if (lang or "").lower() in {"mermaid", "graphviz", "dot", "plantuml"} else "code"
            emit(atype, s, e, body, lang=lang)
            pending_heading_needs_body = False
            i = e + 1
            continue

        if line.strip() == "":
            i += 1
            continue

        # table: header row followed by a separator row
        if "|" in line and i + 1 < n and TABLE_SEP_RE.match(lines[i + 1]):
            s = i
            i += 2
            while i < n and "|" in lines[i] and lines[i].strip():
                i += 1
            e = i - 1
            emit("table", s, e, lines[s : e + 1])
            pending_heading_needs_body = False
            continue

        # standalone image -> diagram
        if IMAGE_RE.match(line):
            emit("diagram", i, i, [line])
            pending_heading_needs_body = False
            i += 1
            continue

        # prose run: until blank line, heading, fence, or table separator
        s = i
        while i < n:
            nl = lines[i]
            if nl.strip() == "" or HEADING_RE.match(nl) or FENCE_RE.match(nl):
                break
            if "|" in nl and i + 1 < n and TABLE_SEP_RE.match(lines[i + 1]):
                break
            i += 1
        e = i - 1
        emit("prose", s, e, lines[s : e + 1])
        pending_heading_needs_body = False

    # trailing empty heading
    if pending_heading_needs_body and heading_stack:
        lvl, title = heading_stack[-1]
        emit("section", heading_stack_line[0], heading_stack_line[0], [f"{'#'*lvl} {title}"])

    return atoms


def main() -> None:
    root = Path(sys.argv[1]).resolve()
    files = sorted(root.glob("docs/**/*.md"))
    all_atoms: list[Atom] = []
    for f in files:
        all_atoms.extend(atomize(f, root))

    out = root.parent.parent.parent / "tmp" / "doc-atoms" / "atoms.jsonl"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w") as fh:
        for a in all_atoms:
            fh.write(json.dumps(asdict(a), ensure_ascii=False) + "\n")

    # summary
    from collections import Counter

    by_type = Counter(a.type for a in all_atoms)
    by_kind = Counter(a.doc_kind for a in all_atoms)
    print(f"files: {len(files)}   atoms: {len(all_atoms)}")
    print("by type:", dict(by_type.most_common()))
    print("by doc_kind:", dict(by_kind.most_common()))
    print(f"wrote: {out}")


if __name__ == "__main__":
    main()
