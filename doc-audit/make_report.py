#!/usr/bin/env python3
"""Generate REPORT.md (GitHub-native drift report) from verdicts.jsonl.

Self-contained: reads verdicts.jsonl next to this script, writes REPORT.md next
to it. Re-run after re-verifying to refresh the report.
"""
import html
import json
import os
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ARTIFACT = "https://claude.ai/code/artifact/78ab2dc6-03f4-4fa1-8f50-e8e0998726aa"

rows = [json.loads(l) for l in open(os.path.join(HERE, "verdicts.jsonl"))]


def cell(s: str, limit: int = 200) -> str:
    s = html.unescape(s or "").replace("\n", " ").strip()
    if len(s) > limit:
        s = s[: limit - 1] + "…"
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("|", "\\|")


tot = Counter(r["verdict"] for r in rows)
N = len(rows)
pf = defaultdict(Counter)
kindof = {}
for r in rows:
    pf[r["file"]][r["verdict"]] += 1
    kindof[r["file"]] = r.get("doc_kind", "?")
files = sorted(pf, key=lambda f: (pf[f]["incorrect"], pf[f]["misleading"], sum(pf[f].values())), reverse=True)

L = []
w = L.append
w("# Documentation Drift Audit")
w("")
w("First input to the documentation rework. Every published how-to / reference / tutorial doc was sliced into "
  "**content atoms**, each atom's prose decomposed into individual factual **claims**, and every claim checked "
  "against the real repositories. This report says, claim by claim, **what to reuse, what to fix, and what to bin.**")
w("")
w("## What this audit does and does not cover")
w("")
w("This covers exactly one axis of the rework: **is what is written true?** It deliberately does **not** cover:")
w("")
w("- **Coverage gaps** - system surface that is undocumented (commands, endpoints, env vars, resources that exist "
  "but appear in no doc). A true claim can sit next to a large hole.")
w("- **Structure and consistency** - grouping, navigation, terminology, duplication across pages.")
w("")
w("Both are tracked as follow-up workstreams at the foot of this report. A claim being `true` means *accurate*, "
  "not *sufficient*.")
w("")
w("## Results")
w("")
w("Corpus: **64** docs -> **2,560** content atoms. Verifiable subset (how-to / reference / tutorial): "
  "**34** files, **1,506** atoms -> **960** factual claims. ADR and design docs are parked - they record decisions "
  "at a point in time, so divergence means *superseded*, not *wrong*.")
w("")
w("| Verdict | Claims | Share | Meaning |")
w("|---|--:|--:|---|")
order = [("true", "reuse as-is - matches the code"),
         ("misleading", "right fact, drifted context - fix in place"),
         ("incorrect", "false as written - rewrite or bin"),
         ("unverifiable", "needs a live system or human intent")]
for v, meaning in order:
    w(f"| **{v}** | {tot[v]} | {tot[v]/N*100:.0f}% | {meaning} |")
w(f"| | **{N}** | | |")
w("")
w(f"**{tot['true']/N*100:.0f}% of documented claims are true.** The rewrite is worth doing for structure and "
  "coverage, but most existing prose is salvageable - this report marks exactly which atoms to keep, so the rework "
  "is a re-organise-and-fill exercise, not a blank page.")
w("")
w("### Dominant failure mode: repo-split drift, not error")
w("")
w("Most non-true claims are `misleading`, not `incorrect`. Developer tooling "
  "(`scripts/k8s`, `tests/e2e`, `env-examples`, k8s manifests) was moved out of `smartem-decisions` into "
  "`smartem-devtools`, so many documented commands and paths point at the wrong repository. The facts are right; "
  "the surrounding instructions need re-homing.")
w("")
w("### Dead documentation (describes removed components)")
w("")
w("`docs/athena/index.md` and `docs/athena-decision-service-api-spec.README.md` document the `athena_api` package, "
  "its mock server and generated client - all **deleted under ADR 0015**. These pages should be removed or rewritten, "
  "not fixed.")
w("")
w("### Code / doc mismatches worth a code fix")
w("")
w("Because verification runs the commands and reads the source, it caught the *code* diverging from the *docs*:")
w("")
w("- Agent `validate` exits `0` on an invalid directory, though the docs promise `1` - the handler returns "
  "`not is_valid` but Typer ignores command return values, so no non-zero exit is raised.")
w("- The documented `--log-file` flag is a no-op: it is declared but never wired to the watcher, so no log file is written.")
w("- `-v` / `--verbose` is inconsistent across agent subcommands - only `watch` accepts a repeatable `-v`; `parse` and "
  "`validate` take a bare `--verbose INTEGER`, so documented `-v` / `-vv` examples error.")
w("")
w("## Interactive triage view")
w("")
w(f"An interactive, filterable version of this data is published as a Claude artifact: <{ARTIFACT}>")
w("")
w("> Note: that link renders only for the artifact owner's Claude account - GitHub sanitises embedded HTML/JS, so "
  "this Markdown report is the public-visible equivalent. Open `doc-audit/drift-map.html` locally for the same view.")
w("")
w("## Files ranked by drift")
w("")
w("| File | Kind | Claims | Wrong | Drift | Reusable |")
w("|---|---|--:|--:|--:|--:|")
for f in files:
    c = pf[f]
    w(f"| `{f.replace('docs/','')}` | {kindof[f]} | {sum(c.values())} | {c['incorrect']} | {c['misleading']} | {c['true']} |")
w("")
w("## Claim-level detail")
w("")
w("Per file, the actionable claims (`incorrect` first, then `misleading`) with the evidence found. Files that are "
  "fully `true` are omitted.")
w("")
sev = {"incorrect": 0, "misleading": 1}
by_file = defaultdict(list)
for r in rows:
    if r["verdict"] in sev:
        by_file[r["file"]].append(r)
for f in files:
    items = by_file.get(f)
    if not items:
        continue
    items.sort(key=lambda r: (sev[r["verdict"]], str(r.get("line", ""))))
    c = pf[f]
    w(f"<details><summary><b>{f.replace('docs/','')}</b> &mdash; {c['incorrect']} wrong, {c['misleading']} drift "
      f"(of {sum(c.values())})</summary>")
    w("")
    w("| Verdict | Line | Claim | Evidence |")
    w("|---|---|---|---|")
    for r in items:
        w(f"| {r['verdict']} | {cell(str(r.get('line','')),12)} | {cell(r.get('claim',''),160)} | {cell(r.get('evidence',''),200)} |")
    w("")
    w("</details>")
    w("")
w("## Follow-up workstreams (the rest of the rework)")
w("")
w("1. **Fix drifted docs** - the 119 `misleading` claims, mostly path/command re-homing to `smartem-devtools`. "
  "Near-mechanical; highest reuse-for-effort.")
w("2. **Remove or rewrite dead docs** - the athena pages and the 56 `incorrect` claims.")
w("3. **Coverage-gap analysis** - enumerate the actual system surface (agent CLI commands, backend OpenAPI "
  "endpoints, env vars, k8s resources, frontend routes) and diff against what is documented, to find undocumented "
  "surface. This audit cannot see those holes.")
w("4. **Restructure and consistency** - regroup by audience/task, unify terminology, dedupe. Use the `true` atoms "
  "as reusable material.")
w("5. **File code bugs** - the validate exit-code, `--log-file` no-op, and verbose-flag mismatches above.")
w("")
w("## Reproduce")
w("")
w("```bash")
w("# 1. Re-slice the docs into content atoms (deterministic)")
w("python doc-audit/atomize.py .   # writes atoms to the workspace tmp dir")
w("# 2. Re-verify claims against the repos (Claude multi-agent pass) -> verdicts.jsonl")
w("# 3. Regenerate this report")
w("python doc-audit/make_report.py")
w("```")
w("")

open(os.path.join(HERE, "REPORT.md"), "w").write("\n".join(L))
print("wrote REPORT.md:", len(L), "lines; verdicts:", dict(tot))
