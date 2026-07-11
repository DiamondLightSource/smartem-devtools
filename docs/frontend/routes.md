# Routes and Views

This is the reference for every view in the SmartEM frontend: its URL, what it shows, and which backend endpoints it reads. The application uses **acquisition** as the primary user-facing term (the URL space is `/acquisitions/...`); the earlier design records used a `/sessions/...` scheme that was never shipped.

Routing is file-based (see [Architecture](architecture.md#routing)). Every view reads its data through the generated `@smartem/api` React Query hooks; the backend endpoint each hook wraps is given alongside it.

## URL map

```
/                                                          Home dashboard
/acquisitions                                              Acquisitions list
/acquisitions/$acquisitionId                               Acquisition overview
/acquisitions/$acquisitionId/grids/$gridId                 (redirects to /atlas)
  .../atlas                                                Atlas spatial view      (default)
  .../squares                                              Grid squares  - Table | Gallery
  .../squares/$squareId                                    Square detail - Map | Predictions
  .../squares/$squareId/holes/$holeId                      Foil-hole detail
  .../predictions                                          Grid-level predictions
  .../workspace                                            Configurable panel workspace
/models                                                    Models catalogue
/models/$modelName                                         Model detail
```

Within a grid, a **view switcher** offers Atlas / Squares / Predictions / Workspace; the grid squares collection has a **Table | Gallery** sub-switch; and square detail has a **Map | Predictions** sub-switch. The bare grid URL redirects to Atlas.

## Views at a glance

| View | URL | Primary backend data |
|---|---|---|
| Home dashboard | `/` | `GET /acquisitions`, `GET /acquisitions/grid-counts` |
| Acquisitions list | `/acquisitions` | `GET /acquisitions` |
| Acquisition overview | `/acquisitions/$acquisitionId` | `GET /acquisitions/{uuid}/grids` |
| Atlas | `.../grids/$gridId/atlas` | grid, gridsquares, atlas image, per-model prediction + latent, suggested squares |
| Grid squares - Table | `.../squares` | gridsquares + per-square foilholes |
| Grid squares - Gallery | `.../squares/gallery` | gridsquares + per-square atlas crops |
| Square detail - Map | `.../squares/$squareId` | gridsquare, foilholes, square image, per-model prediction + latent, suggested holes |
| Square detail - Predictions | `.../squares/$squareId/predictions` | square + foilhole quality time series |
| Foil-hole detail | `.../holes/$holeId` | foilhole, foilhole micrographs |
| Grid predictions | `.../grids/$gridId/predictions` | prediction models + per-model grid prediction |
| Workspace | `.../grids/$gridId/workspace` | grid + gridsquares |
| Models catalogue | `/models` | prediction models, grids, per-grid model weights |
| Model detail | `/models/$modelName` | prediction model, grids, per-grid model weights |

## Home dashboard - `/`

The landing page. A three-panel resizable layout: an **Instruments** panel (currently a placeholder, awaiting an instruments endpoint - smartem-devtools#81), an **Acquisitions** panel splitting active from recent sessions with expandable rows and grid counts, and a **Timeline** (a bespoke SVG Gantt grouped by instrument, with Today/Week/Month ranges). Each acquisition links to its overview.

- **Data:** `GET /acquisitions` (`useGetAcquisitionsAcquisitionsGet`), `GET /acquisitions/grid-counts` (`useGetAcquisitionGridCountsAcquisitionsGridCountsGet`).
- In [mock mode](development.md#mock-mode) a `MockDashboard` is rendered instead of the live dashboard; it is the only mock-only page component besides the context strip.

## Acquisitions

### Acquisitions list - `/acquisitions`

A full-height table of every acquisition (name, status, instrument, start time, duration), newest first; a row opens the acquisition overview.

- **Data:** `GET /acquisitions`.

### Acquisition overview - `/acquisitions/$acquisitionId`

A statistics header (grids completed/total, instrument, duration) above a responsive set of grid cards; each card opens that grid.

- **Data:** `GET /acquisitions/{uuid}/grids` (`useGetAcquisitionGridsAcquisitionsAcquisitionUuidGridsGet`) for the grids; the acquisition's own metadata is taken from the acquisitions list.
- This route also mounts the [context strip](shell.md#context-strip) for the whole acquisition subtree.

## Grid views

The bare grid URL (`/acquisitions/$acquisitionId/grids/$gridId`) immediately **redirects to the atlas view**. All four grid views share the view switcher.

### Atlas - `.../grids/$gridId/atlas`

The default grid view and the spatial centrepiece. A split pane: on the left, the **atlas map** - the grid's atlas image with grid-square overlays, per-model prediction overlays, and highlighting of suggested squares; on the right, a panel showing either a latent-space scatter, a preview of the committed square, or an empty state. Hovering a square highlights it; clicking commits it (the heavier square imagery loads only on commit, per #68).

- **Data:** grid (`GET /grids/{uuid}`), grid squares (`GET /grids/{uuid}/gridsquares`), prediction models (`GET /prediction_models`), the atlas image blob (`GET /grids/{uuid}/atlas_image`), and, fanned out per model, the grid prediction (`GET /prediction_model/{name}/grid/{uuid}/prediction`) and latent representation (`GET /prediction_model/{name}/grid/{uuid}/latent_representation`), plus suggested squares (`GET /grid/{uuid}/prediction_model/{name}/latent_rep/{latent_rep_model_name}/suggested_squares`).
- **Model selection:** the backend does not distinguish model roles, so the view defaults the first model as the prediction model and the second (or first) as the latent-representation model; the latent model is user-selectable. This interim convention is tracked in smartem-frontend#111.

### Grid predictions - `.../grids/$gridId/predictions`

A grid-level, per-model prediction dashboard.

- **Data:** `GET /prediction_models`, then per model `GET /prediction_model/{name}/grid/{uuid}/prediction`.

### Workspace - `.../grids/$gridId/workspace`

A configurable multi-panel workspace over the grid's squares, where panels can be collapsed, removed, and added; selecting a square opens its detail.

- **Data:** grid (`GET /grids/{uuid}`) and grid squares (`GET /grids/{uuid}/gridsquares`).

## Grid squares (collection)

The squares collection has a **Table | Gallery** sub-switch.

### Table - `.../grids/$gridId/squares`

A sortable, expandable table of grid squares: ID, status, whether selected, defocus, magnification, **hole count**, and **score** (the mean foil-hole quality), plus a button to that square's predictions. Expanding a row reveals a sub-table of the square's foil holes with their suggested acquisition **order** and **quality**.

- **Data:** grid squares (`GET /grids/{uuid}/gridsquares`); per square, foil holes (`GET /gridsquares/{uuid}/foilholes`) for the hole count and score; in the expanded sub-table, the square's overall prediction (`GET /gridsquare/{uuid}/overall_prediction`) for acquisition order. The React Query cache is shared between the column data and the expanded sub-table, so expanding a row does not refetch.

### Gallery - `.../grids/$gridId/squares/gallery`

A paginated thumbnail grid; each tile is an authenticated **crop of the grid atlas** for that square, over a checkered placeholder, with a "collected" indicator. Controls: a collected-only filter, column count (2-5), and page size (9/18/36).

- **Data:** grid squares (`GET /grids/{uuid}/gridsquares`); per tile, a server-side crop via `GET /grids/{uuid}/atlas_image?x&y&w&h`.
- Column count and page size are persisted to `localStorage` (`smartem.gallery.columns`, `smartem.gallery.pageSize`). Page size is capped because each tile is a heavy crop.

## Square detail

Square detail is nested outside the collection layout (via a pathless route), and has a **Map | Predictions** sub-switch.

### Map - `.../grids/$gridId/squares/$squareId`

The default square view: the grid-square image with foil-hole overlays, prediction layers, suggested-hole highlighting, and the acquisition-order path. A foil hole opens its detail. An optional right-hand latent-space scatter (toggled by a floating button) cross-highlights the hovered foil hole.

- **Data (via a single `useSquareMapData` hook):** gridsquare (`GET /gridsquares/{uuid}`), foil holes (`GET /gridsquares/{uuid}/foilholes`), prediction models (`GET /prediction_models`), overall prediction (`GET /gridsquare/{uuid}/overall_prediction`), the square image blob (`GET /gridsquares/{uuid}/gridsquare_image`), per-model square prediction (`GET /prediction_model/{name}/gridsquare/{uuid}/prediction`), and suggested holes (`GET /gridsquares/{uuid}/prediction_model/{name}/latent_rep/{latent_rep_model_name}/suggested_holes`). The route additionally fans out the per-model square latent representation (`GET /prediction_model/{name}/gridsquare/{uuid}/latent_representation`) for the scatter. Prediction layers include each model plus a synthetic "Overall" layer; the same model[0]/model[1] convention as the atlas applies (#111).

### Predictions - `.../grids/$gridId/squares/$squareId/predictions`

Per-metric quality analytics for the square: a metric selector, a bespoke SVG "quality over time" line chart, and a foil-hole quality **histogram with an as-of-time slider** - scrub the slider to rebuild the distribution as it stood at a past instant.

- **Data:** the square's quality time series (`GET /gridsquares/{uuid}/quality_predictions`) and the per-foil-hole time series (`GET /gridsquares/{uuid}/foilhole_quality_predictions`).

## Foil-hole detail - `.../squares/$squareId/holes/$holeId`

The deepest view: a foil-hole metadata panel and a grid of micrograph cards showing per-micrograph metrics (motion, CTF fit resolution, particle counts). When no micrographs have been acquired it shows an empty state.

- **Data:** foil hole (`GET /foilholes/{uuid}`) and its micrographs (`GET /foilholes/{uuid}/micrographs`).
- **Leaf image:** the micrograph cards show metadata only - no per-micrograph image is fetched. The `micrograph_image` serving endpoint is not yet in the generated client; its introduction is tracked by ADR 0021 (proposed) and smartem-decisions#308 / #312.

## Models

### Models catalogue - `/models`

A cross-model **weight matrix** for a selectable grid (with a time slider), above a card grid of the registered models; each card shows the model's name, description, and train/infer/update capability chips, and opens the model detail.

- **Data:** `GET /prediction_models`, `GET /grids` (the grid picker, defaulting to the first grid), and `GET /grid/{uuid}/model_weights` (every model's weights for that grid, keyed by name).

### Model detail - `/models/$modelName`

One model in focus: a header with capability chips and description, a weights timeline, and a single-model weight matrix, for a selectable grid.

- **Data:** `GET /prediction_models/{name}`, `GET /grids`, and `GET /grid/{uuid}/model_weights` narrowed to this model.

## Mock mode and views

Only two view components are mock-only: the `MockDashboard` (home) and the `MockContextStrip`. Every other view uses the live `@smartem/api` hooks; in [mock mode](development.md#mock-mode) those requests are served by MSW rather than a real backend, so the same views run unchanged against mocked responses.
