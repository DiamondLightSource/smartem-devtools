# doc-audit

Tracking materials for the **documentation rework**. The docs under `docs/` have drifted from the
code over time; rather than rewrite blind, this audit measures the docs against reality first so the
rework can reuse what is still true and target what is missing. Two axes:

- **Drift** - is what is written true? (REPORT.md)
- **Coverage** - what exists in the system but appears in no doc? (COVERAGE.md)

## Start here

- **[REPORT.md](REPORT.md)** - the drift report: verdict summary, files ranked by drift, per-file
  claim detail, and the follow-up workstreams.
- **[COVERAGE.md](COVERAGE.md)** - the coverage-gap report: the actual system surface (agent CLI,
  backend API, env vars, k8s, frontend routes) diffed against the docs to find what is undocumented.
- **drift-map.html** - an interactive, filterable view of the drift data. Open it in a browser
  (`xdg-open doc-audit/drift-map.html`). Self-contained, no server needed.

## Method

1. **Atomise** - `atomize.py` slices each Markdown doc into line-anchored **content atoms**
   (prose / code / table / diagram / heading), deterministically and re-runnably.
2. **Decompose and verify** - each prose atom is split into individual factual **claims**; every
   claim (and each code/table/diagram block) is checked against the real repositories and given a
   verdict: `true` (reuse), `misleading` (right fact, drifted context), `incorrect` (false as
   written), `unverifiable` (needs a live system).
3. **Report** - `make_report.py` renders `verdicts.jsonl` into `REPORT.md`.

Only how-to / reference / tutorial docs are verified. ADRs and design docs are parked: they record
decisions at a point in time, so divergence means *superseded*, not *wrong*.

## Files

| File | What it is |
|---|---|
| `REPORT.md` | Human-readable drift report (generated) |
| `COVERAGE.md` | Coverage-gap report: system surface vs docs (undocumented surface) |
| `drift-map.html` | Interactive triage dashboard for the drift data (generated, self-contained) |
| `verdicts.jsonl` | One record per verified claim: file, line, claim, verdict, evidence, confidence |
| `manifest.json` | The 34-file verifiable work-list with oracle-routing hints |
| `atomize.py` | The deterministic Markdown -> content-atom slicer (`python atomize.py <repo-root>`) |
| `make_report.py` | Regenerates `REPORT.md` from `verdicts.jsonl` |

## Scope note

Together the two reports cover **truth** (REPORT.md) and **coverage** (COVERAGE.md). Neither measures
**structure/consistency** (grouping, navigation, terminology, duplication) - that remains a rework
workstream. A `true` claim is accurate, not sufficient; a covered surface is present, not
necessarily well-organised.
