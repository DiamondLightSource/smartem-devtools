# SmartEM Frontend: UX and Functional Requirements

## 1. Introduction and Users

SmartEM Frontend is a web application for monitoring and reviewing cryo-electron microscopy (cryo-EM) data acquisition sessions at Diamond Light Source. It provides real-time visibility into automated data collection, displays ML-driven quality predictions at multiple levels of the sample hierarchy, and supports both live session monitoring and post-session analysis. The frontend is a pure SPA that consumes the SmartEM backend REST API and is deployed in proximity to the backend infrastructure.

### 1.1 Primary Users

| User | Role | Primary Needs |
|------|------|---------------|
| **Facility operators / microscopists** | Run and monitor acquisition sessions at the beamline | Live session status, quality feedback during collection, ability to assess whether collection is proceeding well |
| **Researchers** | Review data quality after sessions, plan follow-up experiments | Post-session analysis, quality distributions, comparison across grids and models |
| **Facility managers** | Oversee utilisation and throughput | High-level session summaries, completion rates, time-on-task |

### 1.2 Usage Modes

- **Live monitoring**: Operator observes an active acquisition session. Data arrives incrementally as the microscope collects. ML predictions update as processing completes. The operator needs to see progress and quality signals without manually refreshing.
- **Post-session review**: Researcher or operator reviews a completed session. All data is available. The user explores quality across grids, squares, and foil holes. They compare ML models, examine spatial patterns, and identify regions of interest.

---

## 2. Information Architecture

### 2.1 Data Hierarchy

The domain has a strict parent-child hierarchy that drives navigation:

```
Acquisition (session)
└── Grid (one per physical grid/sample)
    ├── Atlas (spatial overview of the entire grid)
    │   └── Atlas Tiles (stitched image segments)
    ├── Grid Square (region of the grid imaged at medium magnification)
    │   ├── Foil Hole (individual hole in the carbon support film)
    │   │   └── Micrograph (high-resolution image of the specimen)
    │   └── Quality Predictions (ML scores at square or foilhole level)
    └── Prediction Models (ML models that produce quality scores)
```

### 2.2 Page Hierarchy and Navigation Model

Navigation follows the data hierarchy with lateral views at each level.

> **Note**: Route paths are being redesigned as part of the frontend redesign. The paths below reflect the legacy application. The new route structure uses session-anchored nesting (`/sessions/:sessionId/grids/:gridId/...`) — see the [design specification](smartem-frontend-design.md) for the current route plan.

```
Session List (Home)
├── Session Dashboard (/sessions/:sessionId)
│   ├── Grid Explorer (/sessions/:sessionId/grids/:gridId)
│   ├── Atlas View (/sessions/:sessionId/grids/:gridId/atlas)
│   ├── Grid Square Gallery (/sessions/:sessionId/grids/:gridId/squares)
│   ├── Workspace (/sessions/:sessionId/grids/:gridId/workspace)
│   ├── Grid Square Detail (/sessions/:sessionId/grids/:gridId/squares/:squareId)
│   └── Quality Analytics (/sessions/:sessionId/grids/:gridId/squares/:squareId/predictions)
└── Models Overview (/models)
    └── Model Weights (/models/:modelName)
```

A **spatial context strip** replaces traditional breadcrumbs, showing miniature thumbnails of the zoom path (atlas → square → hole) that serve the same "where am I" function with spatial meaning. See the [design specification](smartem-frontend-design.md) for details.

**Lateral navigation** allows switching between views of the same grid (atlas, table, gallery, workspace) without returning to parent. A view selector (tabs or segmented control) at the grid level enables this.

---

## 3. Views and Functional Requirements

### 3.1 Session List (Home)

**Purpose**: Entry point. Shows all acquisition sessions so the user can find the one they care about.

**What it shows**:
- Table of acquisitions with columns:
  - Session name
  - Status (planned, started, paused, completed, abandoned)
  - Start time, end time (if applicable)
  - Instrument model / ID
  - Grid count (number of grids in the session)
- Live indicator (pulsing dot or badge) for sessions with status `started`
- Quick stats per session: number of grids, number of grid squares collected, progress estimate

**User actions**:
- Click a session row to navigate to Session Dashboard
- Sort and filter by status, date range, instrument
- Search by session name

**Data sources**:
- `GET /acquisitions` (list all acquisitions)

**Open questions**:
- Should completed sessions be shown by default, or should there be a recency filter?
- Should the home page show a summary dashboard (total sessions, active sessions) above the table?

---

### 3.2 Session Dashboard

**Purpose**: Overview of a single acquisition session. Shows session metadata and all grids within it.

**What it shows**:
- Session metadata: name, status, instrument, start/end time, clustering mode/radius, storage path
- Status badge with colour coding (green=completed, blue=started, yellow=paused, grey=planned, red=abandoned)
- Grid list as cards or table rows, each showing:
  - Grid name
  - Grid status (none, scan started, scan completed, grid squares decision started/completed)
  - Scan start/end time
  - Number of grid squares
  - Quick quality summary (if predictions available)
- Session-level quality summary card (aggregated from `GET /quality_metrics`)
- Progress indicator for active sessions

**User actions**:
- Click a grid to navigate to the default grid view (Atlas View or Grid Explorer)
- Return to Session List via breadcrumb

**Data sources**:
- `GET /acquisitions/{acquisition_uuid}` (session detail)
- `GET /acquisitions/{acquisition_uuid}/grids` (grids in session)
- `GET /quality_metrics` (aggregate quality stats)

---

### 3.3 Grid Explorer

**Purpose**: Tabular view of grid squares within a grid, with expandable detail rows.

**What it shows**:
- Table of grid squares with columns:
  - Grid square ID
  - Status (none, registered, foil holes decision started/completed)
  - Selected (boolean - whether the square was selected for collection)
  - Foil hole count
  - Quality prediction score (latest, per selected model)
  - Acquisition datetime
  - Defocus, magnification, pixel size
- Expandable rows revealing foil holes within each square:
  - Foil hole ID
  - Quality score
  - Position (x, y)
  - Diameter
  - Near grid bar flag
  - Micrograph count (if available)

**User actions**:
- Expand/collapse rows to see foil holes
- Sort by any column (foil hole count, quality score, status)
- Filter by status, by "selected only", by quality threshold
- Click Insights icon on a row to navigate to Quality Analytics for that square
- Click a square row to navigate to Grid Square Detail

**Data sources**:
- `GET /grids/{grid_uuid}/gridsquares` (all squares in grid)
- `GET /gridsquares/{gridsquare_uuid}/foilholes` (foil holes per square, on expand)
- `GET /prediction_model/{name}/grid/{grid_uuid}/prediction` (predictions for overlay)

---

### 3.4 Atlas View (Spatial Visualisation)

**Purpose**: Spatial visualisation of the entire grid. The atlas image is an overview image of the physical grid, and grid squares are overlaid as interactive regions.

**What it shows**:
- Atlas image (rendered from MRC data via `GET /grids/{grid_uuid}/atlas_image`)
- Interactive grid square overlays:
  - Circles (or rectangles) positioned at each square's center coordinates
  - Size scaled by grid square physical size and/or prediction value
  - Colour-coded by quality prediction (green > 0.5, red <= 0.5, purple = no prediction)
  - Blue highlight for ML-suggested squares
- Model selector dropdown to choose which prediction model colours the overlay
- Toggle button to show/hide prediction overlay
- Latent space panel (optional, toggleable):
  - Scatter plot of 2D latent representations (from dimensionality reduction)
  - Points coloured by cluster index
  - Click a point to highlight the corresponding grid square on the atlas
  - Model selector for latent representation model
  - Toggle to show/hide unselected squares

**User actions**:
- Hover over a grid square to see tooltip (ID, prediction value, status)
- Click a grid square to freeze selection and see detail summary
- Click a grid square to navigate to Grid Square Detail
- Toggle predictions on/off
- Switch prediction model
- Open/close latent space panel
- Pan and zoom the atlas image

**Data sources**:
- `GET /grids/{grid_uuid}/atlas_image` (atlas image, with optional crop params x, y, w, h)
- `GET /grids/{grid_uuid}/gridsquares` (square positions and metadata)
- `GET /prediction_model/{name}/grid/{grid_uuid}/prediction` (quality predictions)
- `GET /prediction_model/{name}/grid/{grid_uuid}/latent_representation` (latent space data)
- `GET /grid/{grid_uuid}/prediction_model/{name}/latent_rep/{name}/suggested_squares` (suggested squares)
- `GET /prediction_models` (available models for selector)

---

### 3.5 Grid Square Detail

**Purpose**: Detailed view of a single grid square. Shows the square image with foil hole overlays, analogous to Atlas View but one level deeper.

**What it shows**:
- Grid square image (rendered from MRC/TIFF via `GET /gridsquares/{uuid}/gridsquare_image`)
- Interactive foil hole overlays:
  - Circles at each foil hole position
  - Size proportional to diameter and/or prediction value
  - Colour-coded by quality prediction
  - Grey/excluded for foil holes near grid bar
- Model selector dropdown
- Latent space panel (optional):
  - Scatter plot of foil hole latent representations for this square
  - Points coloured by cluster index

**User actions**:
- Hover over a foil hole to see tooltip (ID, prediction, quality, diameter)
- Click a foil hole to see its micrograph information
- Toggle predictions on/off
- Switch prediction model
- Navigate to Quality Analytics via Insights button

**Data sources**:
- `GET /gridsquares/{uuid}/gridsquare_image` (square image)
- `GET /gridsquares/{uuid}/foilholes?on_square_only=true` (foil holes)
- `GET /prediction_model/{name}/gridsquare/{uuid}/prediction` (foilhole predictions)
- `GET /prediction_model/{name}/gridsquare/{uuid}/latent_representation` (latent space)
- `GET /gridsquare/{uuid}/overall_prediction` (overall combined prediction)
- `GET /prediction_models` (available models)

---

### 3.6 Quality Analytics

**Purpose**: Time-series and distribution views of quality predictions for a specific grid square and its foil holes. Answers "how has quality evolved?" and "what is the distribution of quality?"

**What it shows**:
- Grid of cards, each corresponding to a prediction model:
  - **Grid square prediction time series**: Line chart showing prediction value over time
    - Y-axis: quality value (0-1)
    - X-axis: timestamp
    - Statistics panel: mean, current value, standard deviation, time range
  - **Foil hole prediction distribution**: Bar chart (histogram) of foilhole prediction values
    - 19 bins from 0 to 1
    - Temporal slider to scrub through prediction snapshots (most recent to oldest)
- Metric selector dropdown at the top to filter by quality metric name (e.g., default quality vs specific metrics like CTF resolution)

**User actions**:
- Select a prediction model to focus on
- Adjust time range via slider
- Switch between quality metrics
- Compare distributions across time snapshots

**Data sources**:
- `GET /gridsquares/{uuid}/quality_predictions` (time series, grouped by model)
- `GET /gridsquares/{uuid}/foilhole_quality_predictions` (foilhole distributions, grouped by model and foilhole)
- `GET /quality_metric/{name}/gridsquares/{uuid}/foilhole_quality_predictions` (metric-filtered)
- `GET /quality_metrics` (available metrics for selector)

---

### 3.7 Models Overview

**Purpose**: Catalogue of available ML prediction models. Shows what models exist, their metadata, and provides access to model weight evolution.

**What it shows**:
- Grid of model cards, each showing:
  - Model name
  - Description
  - Level (gridsquare or foilhole)
  - Avatar/icon
- Click through to model weight time series for a specific grid

**Model weights view** (sub-page):
- Time series chart of model weight evolution for a given grid
- Shows how the model's confidence/calibration has changed during the session
- Statistics: mean weight, current weight, standard deviation

**User actions**:
- Browse available models
- Click a model card to see detail
- Select a grid to view model weight evolution
- Navigate to Atlas View with a specific model pre-selected

**Data sources**:
- `GET /prediction_models` (list all models)
- `GET /prediction_models/{name}` (model detail)
- `GET /grid/{grid_uuid}/model_weights` (weight time series, grouped by model)

---

### 3.8 Workspace (Configurable Dashboard)

**Purpose**: Flexible layout for power users who want to see multiple views side-by-side during a session.

**What it shows**:
- Expandable/collapsible panels
- Add menu to add components:
  - Atlas view panel
  - Grid Explorer panel
  - Quality Analytics panel
  - Model Weights panel
- Each panel can be expanded to full width or collapsed

**User actions**:
- Add panels from a menu
- Expand/collapse individual panels
- Remove panels
- Future: drag-and-drop reordering, save layout presets

**Data sources**: Same as underlying components (Atlas View, Grid Explorer, etc.)

**Open questions**:
- Should layout persist across sessions (local storage)?
- What is the maximum number of panels before performance degrades?
- Should this replace or complement the individual view pages?

---

## 4. Real-Time Requirements

### 4.1 Live Data Integration

The backend currently supports SSE for agent-to-backend communication (`GET /agent/{agent_id}/session/{session_id}/instructions/stream`). The frontend does not yet consume SSE, but the architecture is designed for it.

**Required real-time behaviours**:

| Data Type | Update Frequency | Mechanism |
|-----------|-----------------|-----------|
| Acquisition status changes | On state transition | Polling or SSE |
| New grid squares appearing | As agent ingests EPU data | Polling or SSE |
| New foil holes registered | As agent processes square metadata | Polling or SSE |
| New micrographs detected | As high-res images are acquired | Polling or SSE |
| Quality predictions | As ML models produce scores | Polling or SSE |
| Model weight updates | As models retrain on new data | Polling or SSE |
| Processing status (motion correction, CTF, particle picking) | As cryoem-services completes stages | Polling or SSE |

**Current approach**: React Query polling with 5-minute stale time and 1 retry. For live monitoring, this should be reduced to a shorter interval (5-30 seconds) when viewing an active session, or replaced with SSE push.

### 4.2 Session Lifecycle States

The frontend must represent these acquisition states visually:

| Status | Visual Indicator | Behaviour |
|--------|-----------------|-----------|
| `planned` | Grey badge | Static, no live updates expected |
| `started` | Blue/green badge + pulse animation | Live updates active, auto-refresh |
| `paused` | Yellow/amber badge | Paused state, may resume |
| `completed` | Green badge (solid) | All data available, no further updates |
| `abandoned` | Red/grey badge | Session terminated early |

### 4.3 Visual Indicators for Data Arrival

During live monitoring:
- New entities (squares, holes, micrographs) should appear with a brief highlight animation
- Prediction overlay colours should update when new predictions arrive
- A "last updated" timestamp or "live" indicator should be visible
- Optional: toast/notification for significant events (new grid started, predictions complete)

---

## 5. Future: Operator Control Features

These features are not currently implemented but are planned. The backend has the infrastructure (SSE instruction stream, agent sessions, instruction acknowledgements) to support them.

### 5.1 Approve/Reject ML Recommendations

- When ML models suggest grid squares for collection, the operator can review and approve/reject individual suggestions
- Approved suggestions are sent as instructions to the agent via the existing SSE instruction mechanism
- Rejection removes the square from the suggested collection set

### 5.2 Manual Square Selection/Deselection

- On the Atlas View, the operator can manually select or deselect grid squares for collection
- Selected squares are sent as instructions to the agent
- Visual distinction between ML-suggested and manually selected squares

### 5.3 Session Pause/Resume

- Operator can pause a running session from the frontend
- Backend sets `paused_time` on the acquisition, agent receives pause instruction
- Resume restarts collection from where it left off

### 5.4 Parameter Adjustment

- Adjust collection parameters (defocus, clustering radius) during a session
- Parameters sent as instructions to agent

### 5.5 Annotation and Notes

- Operator can add text notes to acquisitions, grids, or individual squares
- Notes persist in the database and are visible during post-session review
- Useful for flagging interesting regions or recording observations

---

## 6. Cross-Cutting Concerns

### 6.1 Responsive Design

- Primary target: desktop (1920x1080 and above) - this is the beamline monitoring use case
- Secondary target: tablet (1024px+) for facility walk-arounds
- Mobile not a priority but basic usability should be maintained

### 6.2 Accessibility

- Colour is not the only indicator of quality (use size, shape, labels in addition to colour)
- Keyboard navigation for major interactions
- Screen reader support for tables and navigation
- Sufficient contrast ratios (WCAG 2.1 AA)

### 6.3 Theme

- Light mode first; dark mode will be designed separately
- Colour scheme toggle hidden until dark mode is ready (feature flag)
- Deep MUI theme overrides (transitions, elevation, state layers, density)
- DLS branding (Diamond Light Source logo, eBIC links)

### 6.4 Performance

- Atlas images can be large (4000x4000+ pixels). Use progressive loading and crop parameters where supported.
- Grids can have hundreds of squares with thousands of foil holes. Virtualise long lists.
- Prediction data can be voluminous for time series. Paginate or aggregate server-side.
- Image conversion (MRC to PNG) happens server-side; cache results.

### 6.5 Error States and Offline Behaviour

- Show clear error messages when API calls fail (connection refused, 404, 500)
- Distinguish between "no data yet" (empty state) and "error loading data"
- Stale data indicator when real-time updates are interrupted
- Graceful degradation: if prediction endpoints fail, still show structural data (squares, holes)

---

## 7. API Coverage Matrix

### 7.1 View-to-Endpoint Mapping

| View | Endpoint | Status | Notes |
|------|----------|--------|-------|
| **Session List** | `GET /acquisitions` | Implemented | Missing: grid count per session (requires join or separate call) |
| **Session Dashboard** | `GET /acquisitions/{uuid}` | Implemented | |
| | `GET /acquisitions/{uuid}/grids` | Implemented | |
| | `GET /quality_metrics` | Implemented | Global metrics, not per-session |
| **Grid Explorer** | `GET /grids/{uuid}/gridsquares` | Implemented | |
| | `GET /gridsquares/{uuid}/foilholes` | Implemented | Supports `on_square_only` param |
| | `GET /prediction_model/{name}/grid/{uuid}/prediction` | Implemented | |
| **Atlas View** | `GET /grids/{uuid}/atlas_image` | Implemented | Supports crop via x,y,w,h params |
| | `GET /grids/{uuid}/gridsquares` | Implemented | |
| | `GET /prediction_model/{name}/grid/{uuid}/prediction` | Implemented | Frontend currently uses stubs |
| | `GET /prediction_model/{name}/grid/{uuid}/latent_representation` | Implemented | Frontend currently uses stubs |
| | `GET /grid/{uuid}/prediction_model/{name}/latent_rep/{name}/suggested_squares` | Implemented | |
| | `GET /prediction_models` | Implemented | |
| **Grid Square Gallery** | `GET /grids/{uuid}/gridsquares` | Implemented | |
| | `GET /grids/{uuid}/atlas_image` (cropped) | Implemented | Used for thumbnails |
| **Grid Square Detail** | `GET /gridsquares/{uuid}/gridsquare_image` | Implemented | |
| | `GET /gridsquares/{uuid}/foilholes` | Implemented | |
| | `GET /prediction_model/{name}/gridsquare/{uuid}/prediction` | Implemented | |
| | `GET /prediction_model/{name}/gridsquare/{uuid}/latent_representation` | Implemented | |
| | `GET /gridsquare/{uuid}/overall_prediction` | Implemented | |
| **Quality Analytics** | `GET /gridsquares/{uuid}/quality_predictions` | Implemented | Time series, grouped by model |
| | `GET /gridsquares/{uuid}/foilhole_quality_predictions` | Implemented | Nested: model -> foilhole -> predictions |
| | `GET /quality_metric/{name}/gridsquares/{uuid}/foilhole_quality_predictions` | Implemented | Metric-filtered variant |
| | `GET /quality_metrics` | Implemented | For metric selector |
| **Models Overview** | `GET /prediction_models` | Implemented | Frontend uses stub data |
| | `GET /prediction_models/{name}` | Implemented | |
| **Model Weights** | `GET /grid/{uuid}/model_weights` | Implemented | Time series, grouped by model |
| **Workspace** | (Composite - uses endpoints from other views) | Implemented | |

### 7.2 Identified Gaps

| Need | Current State | Proposed Solution |
|------|--------------|-------------------|
| Grid count per acquisition in session list | Requires `GET /acquisitions/{uuid}/grids` per row (N+1 problem) | Add `grid_count` field to `AcquisitionResponse` or a summary endpoint |
| Per-session quality metrics | `GET /quality_metrics` is global, not scoped to a session | Add `GET /acquisitions/{uuid}/quality_metrics` |
| Acquisition completion percentage | Not computed server-side | Derive from grid statuses client-side, or add server-side calculation |
| Foil hole count per grid square | Requires expanding each square | Add `foilhole_count` to `GridSquareResponse` |
| Micrograph count per foil hole | Not surfaced in foilhole response | Add `micrograph_count` to `FoilHoleResponse` |
| Frontend SSE for live updates | SSE exists only for agent communication | Add frontend-facing SSE endpoint or configure polling intervals |
| Session search/filter | No server-side filtering on acquisitions | Add query params (status, date range, name search) to `GET /acquisitions` |

### 7.3 Frontend Stub Usage (to be migrated to real endpoints)

The frontend currently uses client-side stubs (`packages/api/src/stubs.ts`) for:
- `getPredictionModels` (4 mock models)
- `getPredictions` (grid-level predictions)
- `getLatentRep` (latent representations)

These stubs should be replaced with the real auto-generated React Query hooks once the frontend-backend integration is verified end-to-end.

---

## Appendix A: Entity Status Reference

### Acquisition Status
| Value | Meaning |
|-------|---------|
| `planned` | Session created but not started |
| `started` | Active data collection |
| `paused` | Temporarily paused |
| `completed` | Collection finished normally |
| `abandoned` | Session cancelled |

### Grid Status
| Value | Meaning |
|-------|---------|
| `none` | Initial state |
| `scan started` | Grid scanning in progress |
| `scan completed` | All grid square positions identified |
| `grid squares decision started` | ML model evaluating grid squares |
| `grid squares decision completed` | ML recommendations available for grid squares |

### Grid Square Status
| Value | Meaning |
|-------|---------|
| `none` | Initial state |
| `all foil holes registered` | All foil holes at this square have been detected |
| `foil holes decision started` | ML model evaluating foil holes |
| `foil holes decision completed` | ML recommendations available for foil holes |

### Foil Hole Status
| Value | Meaning |
|-------|---------|
| `none` | Initial state |
| `micrographs detected` | High-resolution images acquired at this hole |

### Micrograph Status
| Value | Meaning |
|-------|---------|
| `none` | Initial state |
| `motion correction started` | Motion correction processing begun |
| `motion correction completed` | Motion correction done |
| `ctf started` | CTF estimation begun |
| `ctf completed` | CTF estimation done |
| `particle picking started` | Particle picking begun |
| `particle picking completed` | Particle picking done |
| `particle selection started` | Particle selection/filtering begun |
| `particle selection completed` | Particle selection done |

### Model Level
| Value | Meaning |
|-------|---------|
| `gridsquare` | Model produces predictions at grid square level |
| `foilhole` | Model produces predictions at foil hole level |

## Appendix B: Frontend Route Summary

> **Note**: These routes reflect the legacy application (`apps/legacy`). The new application (`apps/smartem`) uses session-anchored nesting — see the [design specification](smartem-frontend-design.md) for the new route structure.

### Legacy application routes

| Route | Page | Status |
|-------|------|--------|
| `/` | Session List (Home) | Implemented (basic table) |
| `/acquisitions/:acqId` | Session Dashboard | Implemented (grid table) |
| `/acquisitions/:acqId/grids/:gridId` | Grid Explorer | Implemented (collapsible table) |
| `/acquisitions/:acqId/grids/:gridId/atlas` | Atlas View | Implemented (full) |
| `/acquisitions/:acqId/grids/:gridId/gridsquares` | Grid Square Gallery | Implemented (paginated cards) |
| `/acquisitions/:acqId/grids/:gridId/workspace` | Workspace | Partial (basic panels) |
| `/acquisitions/:acqId/grids/:gridId/squares/:squareId` | Grid Square Detail | Implemented (full) |
| `/acquisitions/:acqId/grids/:gridId/square/:squareId/predictions` | Quality Analytics | Implemented (charts) |
| `/models` | Models Overview | Stub data only |
| `/models/:modelName/grids/:gridId/weights` | Model Weights | Implemented (time series) |
