# 21. Micrograph Motion-Corrected Preview Image Ingestion and Serving

Date: 2026-07-03

## Status

Proposed

## Context

The frontend can navigate the full acquisition hierarchy **Atlas -> Grid Square -> Foil Hole -> Micrograph**. The atlas and grid-square levels each have an image-serving endpoint, but the micrograph (exposure) level - the leaf, where the actual high-magnification data lives - has none. The foil-hole detail view (`smartem-frontend`, `FoilholeDetail.tsx`) therefore renders every micrograph as a grey placeholder tile, so the most scientifically meaningful image in the hierarchy is the one image the API cannot serve. This is recorded as `smartem-decisions` #308.

Three facts frame the decision.

**1. The existing image endpoints share one small rendering path.**

- `GET /grids/{grid_uuid}/atlas_image` - `smartem-decisions` `api_server.py:2751` (accepts an `x,y,w,h` crop query).
- `GET /gridsquares/{gridsquare_uuid}/gridsquare_image` - `api_server.py:2774`.
- Both resolve an on-disk MRC/TIFF and render it to PNG via `_render_image_png` / `_cached_image_response` (`api_server.py:2721-2748`), returning `image/png` with a private cache header. `_render_image_png` reads `.mrc` via `mrcfile` and otherwise via `tifffile`, normalises to 8-bit, optionally crops, and encodes a single 2D array with `PIL.Image.fromarray`.

**2. The only image a micrograph currently stores is the raw movie stack, which is the wrong artefact to serve.**

The `micrograph` row carries `high_res_path` (and `manifest_file`, which points at the same file): a `..._fractions.tiff` - the **raw dose-fractionated movie stack** (multi-frame, multi-gigabyte). Serving it through the existing path fails on two counts: `tifffile.imread` returns a 3D array that `PIL.Image.fromarray` cannot encode as an image, and loading a multi-gigabyte stack into the API pod reproduces the out-of-memory failure already observed on atlas pages. Unprocessed micrographs carry `high_res_path = '.'` (the serialisation of `Path("")`, the agent's unset default), i.e. no file at all. A raw un-aligned average of the fractions would also be scientifically poor. The raw movie is not a display artefact.

**3. The meaningful image is produced downstream, and the integration seam is SmartEM's own HTTP contract - not a direct cryoem-services link.**

- `cryoem-services` motion correction (`services/motioncorr.py`) produces a **motion-corrected 2D average `.mrc`** and, via its images service (`services/images_plugins.py`, `mrc_to_jpeg`), a **downscaled, contrast-normalised `.jpeg` snapshot** (`{mrc}.jpeg`, capped at ~1024 px). It already sends the snapshot path to ISPyB (`micrograph_snapshot_full_path`) and the `.mrc` path (`mc_path`) into its Zocalo `spa.*` messages.
- SmartEM does **not** consume those messages. A repository-wide search for cryoem-services field and register names (`mc_path`, `mc_uuid`, `spa.motion`, `spa.ctf`) finds nothing in `smartem-decisions`. Instead, SmartEM exposes its **own processing-feedback HTTP API**: `POST /micrographs/{micrograph_uuid}/motion_correction/completed` (`api_server.py:1380`) takes `MotionCorrectionCompletedRequest{total_motion, average_motion}`, publishes an internal RabbitMQ event (`MotionCorrectionCompleteBody`, `model/mq_event.py:330`), which `handle_motion_correction_complete` (`consumer.py:408`) consumes to update `QualityMetricStatistics` and the micrograph's `updated_at`. Whatever calls that endpoint - a cryoem-services-to-SmartEM adapter, today effectively a simulator - is the party that holds `mc_path` and the snapshot path.
- The SmartEM agent does not help here: it records no per-exposure image path (`high_res_path` is left as `Path("")`), parses only the per-exposure XML manifest, and it is unconfirmed that EPU emits a per-exposure preview at all. The ingest seam would need new watcher patterns, agent parsing, and a schema field for an artefact that may not exist.

So the scientifically correct image already exists at source (as both a 2D `.mrc` and a ready-made `.jpeg` thumbnail), and the path into SmartEM runs through a contract SmartEM already owns. What is missing is somewhere to put the path, plumbing to carry it, and an endpoint to serve it.

## Decision

Ingest and serve the **motion-corrected** micrograph image from cryoem-services, carried through SmartEM's existing processing-feedback contract. Prefer the ready-made JPEG snapshot; fall back to rendering the 2D MRC. Do not serve `high_res_path`.

### 1. Persist two nullable paths on the micrograph

Add two nullable columns to the `micrograph` table via an Alembic migration:

- `motion_corrected_image_path: str | None` - the motion-corrected 2D average `.mrc` (cryoem-services `mc_path` / ISPyB `micrograph_full_path`).
- `motion_corrected_snapshot_path: str | None` - the downscaled `.jpeg` snapshot (ISPyB `micrograph_snapshot_full_path`).

Both are recorded because they serve different roles: the snapshot is the cheap display artefact, the MRC is the source-fidelity fallback and the substrate for future crop/zoom. No backfill; existing rows remain null.

### 2. Extend the processing-feedback contract additively

Add both fields as optional (nullable, default `None`) to `MotionCorrectionCompletedRequest` (HTTP request model) and `MotionCorrectionCompleteBody` (RabbitMQ body, `model/mq_event.py`). Existing callers that omit them keep working unchanged, so this is backward-compatible. `handle_motion_correction_complete` persists whichever paths are present onto the micrograph row (extending the handler, which today only touches statistics and `updated_at`).

### 3. Serve with a JPEG-first, MRC-fallback endpoint (re-scopes #308)

Add `GET /micrographs/{micrograph_uuid}/micrograph_image`, resolving in order:

1. if `motion_corrected_snapshot_path` is set and the file exists, return it directly as a `FileResponse` (`image/jpeg`) - no rendering, no decode of large data, structurally immune to the atlas-page OOM class;
2. else if `motion_corrected_image_path` is set and the file exists, render it via the existing `_render_image_png` / `_cached_image_response` helpers (a 2D `.mrc` is exactly what they already handle), accepting the same optional `x,y,w,h` crop query as `atlas_image` for future zoom parity;
3. else return `404`.

The endpoint never reads `high_res_path`; the raw movie stack is deliberately not a serving source.

### 4. Coordinate the producer separately

The cryoem-services-to-SmartEM adapter that calls `motion_correction/completed` must include the two paths. cryoem-services already generates both artefacts, so this is an additive change at the boundary, not new image production. It lives outside `smartem-decisions` and is tracked as a separate coordination item; until it supplies the paths, the columns stay null and the endpoint returns `404`, which is correct behaviour.

### 5. Alternatives rejected

- **Render `high_res_path`** (the naive reading of #308): wrong artefact (raw movie), 3D-array encoding failure, and OOM. Rejected.
- **Capture a preview at EPU/agent ingest**: no path exists today, EPU per-exposure preview is unconfirmed, and it adds the most moving parts for the least certain payoff. Rejected as the source; may be revisited if EPU is confirmed to emit one.
- **Serve only the MRC** or **only the JPEG**: MRC-only pays a render cost on every exposure and loses the cheap path; JPEG-only loses the source-fidelity fallback and the crop/zoom substrate. Storing both and serving JPEG-first captures the strengths of each.

## Consequences

- `smartem-frontend`'s `FoilholeDetail.tsx` micrograph card can show a real motion-corrected preview, fetched as an authenticated blob turned into an object URL (the pattern already used for atlas and grid-square images; see #116). This completes the leaf of the spatial hierarchy.
- `smartem-decisions` #308 is **re-scoped** from "serve `high_res_path`" to this endpoint, and is **gated** behind the ingestion contract and schema change. #309 tracks the schema migration, contract extension, and consumer persistence (items 1-2); #310 tracks the cryoem-services adapter supplying the paths (item 4).
- The migration adds two nullable columns with no backfill. Existing and dump data have them null (the current prod dump predates any processed-image path and also has all numeric metrics null), so the endpoint returns `404` against today's data; the render/fallback logic is validated by unit tests rather than against the local dump.
- Serving the pre-downscaled JPEG makes this endpoint zero-render on the common path, keeping it clear of the memory-pressure problems that affect the atlas overview.
- The choice returns a ready raster from the server, which is compatible with any resolution of the deferred frontend image-serving and zoom question (`smartem-frontend` #111); the MRC-fallback branch preserves a crop path if server-side tiling is later chosen.
- Naming deliberately echoes cryoem-services / ISPyB (`*_snapshot_*` for the JPEG, the motion-corrected MRC for the image) to keep the cross-system mapping obvious.
- On completion a new `smartem-decisions` release is warranted (new endpoint, schema migration, contract fields). No `smartem-frontend` change is required by this ADR, though the frontend card wiring is the natural follow-on.
