# Shell and Navigation

The shell is the chrome that surrounds every view: the header, the command palette, the settings menu, the authentication controls, and the spatial context strip. It is defined in `apps/smartem/src/routes/__root.tsx` and `apps/smartem/src/components/shell/`. There is deliberately **no footer and no breadcrumb trail** - the context strip provides spatial orientation instead.

## Header

The header is a sticky bar (`components/shell/Header.tsx`) containing, left to right:

- **Logos** - Diamond/eBIC and FragmentScreen marks, each linking out to the respective site in a new tab.
- **Wordmark** - "SmartEM", linking to the home dashboard (`/`).
- **Navigation links** - the primary top-level destinations (see below).
- **Search box** - a read-only field ("Search or jump to...") that opens the command palette; it also shows the `/` keyboard hint.
- **Settings menu** and **authentication controls** - at the right.

### Navigation links

| Link | Destination | Notes |
|---|---|---|
| Acquisitions | `/acquisitions` | The acquisition (session) list |
| Models | `/models` | The ML models catalogue |
| Depositions | `/depositions` | Hidden - gated by the `depositions` feature flag (default off); the route does not exist while the flag is off |

The active link is highlighted by matching the current path prefix.

## Command palette

The command palette (`components/widgets/CommandPalette/`) is a fuzzy "jump to" launcher.

- **Opening it** - press <kbd>/</kbd> anywhere (except while typing in an input, textarea, select, or editable field), or click the header search box. <kbd>Esc</kbd> closes it.
- **What it searches** - four groups:
  - **Navigation** - the visible header links (with extra search keywords, so "sessions" finds Acquisitions).
  - **Acquisitions**, **Grids**, and **Models** - live backend data. These queries are lazy: they are fetched only when the palette is first opened, then cached. Each group shows up to 25 results.
- **Matching and keyboard use** - results are scored (exact, prefix, substring, then subsequence) across label, description, and keywords, and re-grouped by category. Arrow keys and <kbd>Tab</kbd> move the selection (wrapping), <kbd>Enter</kbd> activates it.
- **Deep-linking** - selecting a result navigates straight to it: an acquisition to `/acquisitions/$acquisitionId`, a grid to its atlas view, a model to `/models/$modelName`.

## Settings menu

The settings menu exposes six items, of which two are functional and four are placeholders for planned work:

| Item | State |
|---|---|
| Light / Dark mode | Placeholder ("soon") - the theme is light-only for now |
| Language | Placeholder ("English") |
| Display density | Placeholder - see the `density` feature flag |
| Documentation | Opens this documentation site |
| Keyboard shortcuts | Placeholder |
| Report a bug | Opens the smartem-frontend issue tracker |

## Authentication controls

When signed out, the header shows a sign-in button that starts the Keycloak login. When signed in, it shows an account menu with the user's name and email and a sign-out action. Authentication gates the **whole application** - the SPA renders a sign-in screen until Keycloak reports an authenticated session (it is not enforced per route). The mechanism is described in [Keycloak Authentication for SmartEM SPA](../architecture/keycloak-spa-authentication.md); running a local Keycloak for development is covered in [Local Keycloak for SmartEM frontend dev](../development/local-keycloak.md). In [mock mode](development.md#mock-mode) authentication is bypassed with an auto-signed-in mock user.

## Context strip

Within an acquisition, a thin **context strip** sits above the view (`components/session/ContextStrip.tsx`). It renders the current position in the acquisition hierarchy - acquisition, then grid, then square, then hole - as a row of linked segments, so a user can jump back up the chain without a breadcrumb bar. It is display-only (it reads route parameters and issues no API calls) and appears only inside acquisition routes; elsewhere it renders nothing.

## Feature flags

Incomplete or experimental UI is hidden behind feature flags (`apps/smartem/src/config/feature-flags.ts`). Each flag has a compile-time default of `false`; a deployment can turn any of them on through the `features` map in its runtime [`config.json`](architecture.md#runtime-configuration).

| Flag | Gates | Default |
|---|---|---|
| `depositions` | The ARIA depositions route and its nav link (not yet built) | off |
| `agentLogs` | A future SSE-backed agent log viewer | off |
| `darkMode` | The dark colour scheme (designed separately, not yet built) | off |
| `density` | The compact/comfortable/spacious display-density control | off |

Only `depositions` currently gates any visible UI. Because runtime configuration is applied once before the first render and is static thereafter, flags are read synchronously (via `getFeatureFlag` / `useFeatureFlag`) with no reactive re-rendering.
