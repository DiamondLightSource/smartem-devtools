# SmartEM Frontend: Design Specification

**Status**: Working draft — route structure and several UI decisions are marked as temporary or deferred

This document describes the architectural and UX design of the SmartEM frontend: how the system is structured, the principles that guide it, and the patterns it follows. It complements the [functional requirements specification](smartem-frontend-requirements.md), which describes *what* the system should do.

---

## 1. Overview

SmartEM Frontend is a single-page application for monitoring and reviewing cryo-electron microscopy (cryo-EM) data acquisition sessions at Diamond Light Source. It consumes a backend REST API, an SSE event stream (via RabbitMQ), and will integrate with ARIA's GraphQL API for data deposition.

An existing system called **Pato** (with its own backend and frontend) already provides much of the core monitoring and analysis functionality. SmartEM is being built alongside Pato, not replacing it. Some functionality will initially proxy through the SmartEM API to Pato's backend. Users will migrate naturally as SmartEM offers features Pato does not: real-time ML recommendations, live monitoring with SSE, operator advisory controls, and ARIA deposition integration.

### Design ambition

The frontend aims to be significantly above typical internal-tool standard — not merely functional but carefully crafted in its visual design, interaction patterns, and attention to detail. Typography, spacing, transitions, and information density are treated as first-class design concerns. The goal is a professional scientific instrument interface that rewards sustained use.

---

## 2. Technology Stack

| Category | Technology | Notes |
|----------|------------|-------|
| Framework | React 19 | |
| UI Components | Material UI (MUI) | Deep theme overrides beyond basic `createTheme` |
| Routing | TanStack Router | Type-safe, search param serialisation, loader patterns |
| Server State | TanStack Query | Auto-generated hooks via Orval |
| Tables | TanStack Table | Headless — full styling control |
| Build | Vite | |
| Linting/Formatting | Biome | |
| Git Hooks | Lefthook | |
| Component Library | sci-react-ui (DLS shared) + @smartem/ui (local) | |

### API integration patterns

The frontend consumes three distinct API surfaces:

1. **REST / OpenAPI** — CRUD operations for the full data domain (sessions, grids, squares, foil holes, predictions, models). The backend is FastAPI and publishes an OpenAPI spec. Typed React Query hooks are auto-generated via Orval. Goal: near-zero hand-written fetch calls.

2. **SSE (Server-Sent Events)** — Live event stream from RabbitMQ for real-time data during active sessions (agent events, new entities, prediction updates). The SSE client pushes cache invalidations into React Query so views update transparently regardless of whether data arrived via fetch or event stream. This is the only bespoke data integration piece.

3. **GraphQL** — ARIA deposition API for scientific dataset submission (external system). Thin client layer via `graphql-codegen` with React Query plugin or a lightweight wrapper (urql or fetch-based).

---

## 3. Repository Structure

The repository is structured as an npm workspaces monorepo (see [ADR-0017](decisions/0017-smartem-frontend-monorepo-restructure.md)):

```
smartem-frontend/
├── apps/
│   ├── legacy/              # Existing application (moved from src/)
│   └── smartem/             # New application — fresh routes, new shell
├── packages/
│   ├── api/                 # @smartem/api — Orval config, generated hooks, mutator, types, stubs
│   └── ui/                  # @smartem/ui — SmartEM UI library (local, eventually syncs with sci-react-ui)
├── package.json             # npm workspaces root
├── biome.json               # Shared lint/format config
├── tsconfig.base.json       # Shared TypeScript config (apps extend)
└── lefthook.yml             # Shared git hooks
```

- Both apps import from `@smartem/api` and `@smartem/ui`
- One app runs at a time (`npm run dev` for legacy, `npm run dev:smartem` for new)
- sci-react-ui remains a dependency of the legacy app; `@smartem/ui` is the new local library
- `@smartem/ui` will eventually sync with sci-react-ui (take from and contribute back)
- Mock dev mode (MSW) is carried forward to the new app
- The command palette / omnibox component lives in `@smartem/ui` for potential sharing

---

## 4. Configuration Layers

| Layer | Purpose | Example | Mechanism |
|-------|---------|---------|-----------|
| **Env config** | Deploy-time infrastructure | API base URL, auth endpoint | `import.meta.env.VITE_*` |
| **App config** | Runtime behaviour | Default density mode, default theme | Runtime config file (JSON) loaded at startup |
| **Feature flags** | Toggle incomplete/experimental features | Show agent logs tab, enable deposition route | Keys in app config, checked in code |

Unsettled UI choices are hidden behind feature flags until confirmed. This avoids premature commitment to interaction patterns that may change.

---

## 5. Data Domain Hierarchy

The cryo-EM data domain has a strict parent-child hierarchy that drives both navigation and information architecture:

```
Visit (scientist visiting facility)
└── Session (user working with microscope)
    └── Acquisition (data-model specific, tied to a microscope)
        └── Grid (physical grid/sample, up to 12+ per cassette)
            ├── Atlas (spatial overview image + tiles)
            ├── GridSquare (region at medium magnification)
            │   └── FoilHole (individual hole in carbon film)
            │       └── Micrograph (high-resolution image)
            └── Prediction Models (ML quality scores at square/hole level)
```

### Terminology clarification

- **Session** is the user-facing term for working with the microscope. This is what users think in terms of.
- **Acquisition** is the data-model term, specific to a microscope. Usually 1:1 with session, but a microscope swap mid-session creates a new acquisition.
- **Visit** is a first-class citizen for ARIA depositions and facility administration. A visit contains sessions.

### Open domain questions

- **Visit → Session → Acquisition relationship**: How does the URL/navigation handle the case where session and acquisition are not 1:1? Does the user think in terms of sessions or acquisitions?
- **Cassette reloading**: Up to 12 grids per cassette, but reloading is possible. Is there a meaningful "cassette" concept in the UI, or is it a flat list of grids under an acquisition?
- **Remote visits**: Users can visit remotely. Does this change anything about the UI (different controls, video feed, latency considerations)?
- **Visit metadata**: Where does visit info come from — SmartEM's data model or an external system (e.g. DLS user office, ISPyB)?

---

## 6. Shell Chrome

### 6.1 Header (fixed, always visible)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]  [Sessions] [Models]   [ Search or jump to... ⌘K ]  [◐ ☰] │
└─────────────────────────────────────────────────────────────────┘
```

| Zone | Content | Notes |
|------|---------|-------|
| **Left** | SmartEM logo/wordmark | Click navigates home |
| **Left-centre** | Top-level nav links: Sessions, Models | Kept visible for now — few top-level sections. Easy to remove later if the command palette makes them redundant. |
| **Centre** | Omnibox bar | Compact search field; opens command palette on focus/click or `Cmd+K` |
| **Right** | Density toggle, colour scheme toggle | Later: user avatar/menu, live indicator |
| **Right** | Login/logout placeholder | UI placeholder only — auth not implemented yet |

No footer. Any links that would traditionally live in a footer move to an about/settings page.

### 6.2 Context Strip (session-scoped, below header)

Only renders when inside a `/sessions/:id/**` route. Provided by the session layout route.

```
┌─────────────────────────────────────────────────────────────────┐
│ Session: EM-2026-0042 ● Live    [atlas thumb] → [sq thumb] → [hole thumb] │
└─────────────────────────────────────────────────────────────────┘
```

| Element | Description |
|---------|-------------|
| **Session name + status** | Name and colour-coded status badge (green=completed, blue=started, yellow=paused, grey=planned, red=abandoned) |
| **Live indicator** | Pulse dot + "Live" or "Last updated: Xs ago" for active sessions |
| **Spatial thumbnail chain** | Miniature thumbnails showing the zoom path: atlas → selected square → selected hole. Each clickable to navigate back to that level. Thumbnails highlight the currently selected entity. Accumulate left-to-right as the user drills deeper. |

The context strip replaces traditional breadcrumbs with spatial meaning — the user can *see* where they are on the specimen rather than reading a text path.

### 6.3 Command Palette / Omnibox

Overlay triggered by `Cmd+K` or clicking the omnibox bar. Renders above all content.

**Implementation**: Open decision — use the `cmdk` library or a bespoke omnibox component. Either way, the component lives in `@smartem/ui` for potential sharing with sci-react-ui.

**Search targets**:
- Sessions — by name, date, instrument, status
- Grids — by name, ID
- Squares, holes — by ID (deep link jump)
- Models — by name
- Commands — "go to latest session", "switch to dark mode", "toggle compact density", "toggle feature X"

**Behaviour**:
- Results grouped by category (Sessions, Grids, Models, Commands)
- Recent items shown when opened with empty query
- Keyboard navigation (arrows, enter, esc)
- Fuzzy matching
- Selected result navigates to entity or executes command

### 6.4 Density Modes

Three levels: **compact** / **comfortable** / **spacious**. Toggle in header cycles through them.

Affects spacing, font sizes, table row heights, card padding, and chart dimensions. All via CSS custom properties on the root element. Every component respects density from the start — this is not a retrofit.

### 6.5 Theme

- **Light mode first** — dark mode will be designed separately later
- Colour scheme toggle hidden until dark mode is ready (feature flag)
- Deep MUI theme overrides beyond basic `createTheme` (transitions, elevation, state layers, density)
- Typography and vertical rhythm tuned for data-heavy views
- Accessible colour scales for predictions and heatmaps (colour is never the only indicator)

### 6.6 Complete Shell Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]  [Sessions] [Models]   [ Search... ⌘K ]   [◐] [user]   │  ← Header (always)
├─────────────────────────────────────────────────────────────────┤
│ Session: EM-2026-0042 ● Live   [atlas] → [sq] → [hole]        │  ← Context strip (session routes)
├─────────────────────────────────────────────────────────────────┤
│  [Atlas]  [Squares]  [Predictions]  [Workspace]                │  ← View switcher (grid routes)
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│                       Route content                             │  ← Outlet
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Command palette: full-screen overlay on ⌘K, above everything
```

---

## 7. Route Structure

**Status**: Temporary — using Option B (session-anchored nesting) as the working structure. Will be revisited once auth, ARIA deposition, and admin views are better defined.

### Spatial hierarchy routes

```
/                                                          → Landing page (placeholder)
/visits/:visitId                                           → Visit overview (content TBD)
/sessions/:sessionId                                       → Session overview (layout route)
/sessions/:sessionId/grids/:gridId                         → Grid level (layout route, atlas default)
/sessions/:sessionId/grids/:gridId/atlas                   → Atlas spatial view
/sessions/:sessionId/grids/:gridId/squares                 → GridSquare table/gallery
/sessions/:sessionId/grids/:gridId/predictions             → Grid-level prediction dashboard
/sessions/:sessionId/grids/:gridId/workspace               → Configurable panel layout
/sessions/:sessionId/grids/:gridId/squares/:squareId       → Square detail (layout route)
/sessions/:sessionId/grids/:gridId/squares/:squareId/holes/:holeId
                                                           → Foil hole detail (TBD)
/sessions/:sessionId/grids/:gridId/squares/:squareId/holes/:holeId/micrographs/:micrographId
                                                           → Micrograph detail (TBD)
```

### Cross-cutting routes

```
/models                                → ML model catalogue
/models/:modelName                     → Model detail + cross-grid performance
/sessions/:sessionId/logs             → Agent log viewer (future, feature-flagged)
/sessions/:sessionId/deposition       → ARIA deposition workflow (future, feature-flagged)
```

### Layout routes

- **Root (`__root`)**: Header + command palette overlay + outlet
- **Session (`/sessions/:sessionId`)**: Context strip (session name, live status, spatial thumbnail chain) + outlet
- **Grid (`/sessions/:sessionId/grids/:gridId`)**: View switcher (Atlas | Squares | Predictions | Workspace) + outlet
- **Square (`/.../squares/:squareId`)**: Parallel structure to grid level (spatial default + view switcher)

### Navigation within grid level

A view switcher (tabs, segmented control, or chips) enables lateral navigation between views of the same grid without returning to the parent:

- **Atlas** (default) — spatial map with prediction overlays
- **Squares** — tabular/gallery view with stats
- **Predictions** — grid-level prediction charts
- **Workspace** — configurable multi-panel layout

Square level mirrors this structure with fewer tabs.

### Open routing questions

- Should `/visits/:visitId` show sessions for that visit, or be a richer visit-level view (metadata, ARIA deposition status, linked proposals)?
- Where does acquisition sit? Hidden inside session context, or exposed in the URL when a session has multiple acquisitions?
- Do admin/facility routes live in the same namespace or under an `/admin` prefix?
- How do "my sessions" vs "all sessions" vs "visit sessions" relate in navigation when auth is in place?

---

## 8. UX Principles

### No modals

With the rarest exceptions (destructive confirmation dialogs, and even those should prefer inline confirmation with undo), nothing becomes a modal. Everything that would lazily become a modal should be an inline expansion, slide-over panel, dedicated route, or in-context reveal.

### Spatial navigation metaphor

The data hierarchy (session → grid → square → foil hole → micrograph) maps to decreasing physical scale on the specimen. Navigation should feel like zooming into a specimen, not clicking through a file tree. The context strip reinforces this with spatial thumbnails rather than text breadcrumbs.

### Motion as information

Layout animations communicate state changes rather than serving as decoration. Filter results flow rather than snap. Form sections settle rather than shove. New entities appear with brief highlight animations. Prediction overlays update smoothly when new data arrives.

### Keyboard-first

The command palette (`Cmd+K`) is the highest-impact power user feature. Keyboard shortcuts are provided for major interactions throughout the application. The interface is usable without a mouse for common workflows.

### Accessible colour scales

Colour is never the sole indicator of quality or status. Predictions and heatmaps use size, shape, and labels in addition to colour. Colour scales are chosen for accessibility (sufficient contrast ratios, distinguishable in common forms of colour vision deficiency). WCAG 2.1 AA compliance as a baseline.

### Data density as a design parameter

The application is data-heavy by nature. Rather than fighting this, density modes (compact/comfortable/spacious) treat information density as a first-class design parameter. Typography, spacing, and vertical rhythm are tuned for sustained use with tabular and chart-heavy views.

---

## 9. State Management

### Approach

| Concern | Owner | Mechanism |
|---------|-------|-----------|
| Server state | React Query | Auto-generated hooks via Orval, cache invalidation via SSE |
| View state | URL search params | TanStack Router serialisation (deep links, shareability) |
| App-wide UI state | React context | Theme, command palette visibility, SSE connection status, density mode |
| Complex cross-view coordination | Deferred | Add Zustand/Jotai only if a specific problem demands it |

### SSE integration pattern

The SSE client maintains a persistent connection during active session monitoring. When events arrive, the client invalidates the relevant React Query cache entries rather than managing a parallel state tree. This means views update transparently — they do not need to know whether data arrived via an initial fetch or a live event.

The most likely candidate for a dedicated client-side store is coordinating linked selections across workspace panels (e.g. clicking a point in a latent space scatter plot highlights the corresponding grid square on the atlas). This will be evaluated when the workspace view is implemented.

### What is explicitly avoided

- No centralised Redux-style store by default
- No parallel state trees that duplicate server data
- No prop drilling for cross-cutting concerns (use context instead)

---

## 10. Reference: Existing System Patterns

The existing Pato system provides useful reference for features SmartEM will need:

- **Atlas view**: Two-panel layout — grid overlay left, foil hole heatmap right with metric toggles (resolution, astigmatism, particle count)
- **Processing views**: CTF graphs, motion correction drift plots, particle picking stats, 2D/3D classification galleries, refinement — as expandable accordion sections
- **Micrograph viewing**: Before/after image flipper, dark image detection, movie-by-movie navigation
- **Heatmaps**: Foil hole overlays with configurable metrics and colour scales
- **Calendar view**: Calendar component for browsing sessions by date
- **Alerts**: User-configurable metric thresholds with email notifications
- **Navigation**: Proposal → Session → Data Collection Groups → type-dispatched views

SmartEM's differentiation: real-time ML recommendations, live monitoring with SSE, operator advisory controls, ARIA deposition integration.

---

## 11. Deferred Scope

These are acknowledged as important but deferred from the initial shell implementation. All can be feature-flagged in when ready.

| Feature | Notes |
|---------|-------|
| **Auth implementation** | Placeholders for login/logout only. Design accommodates route guards, token management, conditional UI. |
| **Dark mode** | Light mode first. Dark mode will be designed separately. |
| **SSE live data integration** | Architecture designed for it; implementation deferred. |
| **ARIA GraphQL deposition** | Needs its own route and multi-step form workflow. |
| **Agent log viewer** | Structured log events with correlation to atlas view. Backend work also needed. |
| **Bug reporting widget** | One-click capture of URL, screenshot, cache state, browser info → GitHub Issues. |
| **Mobile version** | Different functionality from desktop (session status, failure alerts, quality trends). Needs separate design discussion for build strategy, structure, and activation. |
| **Operator controls** | Approve/reject ML recommendations, manual square selection, session pause/resume, parameter adjustment, annotations. These collectively require a toolbar/action bar in the atlas/grid view. |
| **Processing pipeline view** | Per-micrograph processing status (motion correction → CTF → particle picking → selection). Orthogonal to the spatial hierarchy. |
| **Foil hole + micrograph detail views** | Routes exist in the structure; content needs domain input to specify. |
| **CI pipeline** | Monorepo CI (lint, typecheck, build per app). Tracked separately. |
| **Bun.js evaluation** | Evaluate as alternative to Node.js for dev tooling and package management. |
| **Command palette implementation** | `cmdk` library vs bespoke component — compare capabilities, styling flexibility, maintenance burden. |
| **State management review** | The "no centralised store by default" approach needs validation against specific cross-view coordination scenarios. |
| **Minimum supported screen size** | Identify the smallest viewport that fits the desktop content. |
| **Release versioning** | Strategy for matching frontend versions with backend, agent, and other system components. |
