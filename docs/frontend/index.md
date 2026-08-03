# Frontend

Documentation for the SmartEM frontend - the web application that presents acquisition sessions, spatial navigation of grids, and machine-learning quality predictions to users. It is a single-page application (SPA) that talks to the SmartEM backend HTTP API.

```{toctree}
:maxdepth: 1

architecture
routes
shell
development
```

## Topics

### Understanding the app

- [Architecture](architecture.md) - Monorepo layout, technology stack, file-based routing, the generated API client, and theming
- [Routes and Views](routes.md) - The URL structure and a reference for every view: what it shows and which backend data it reads

### Using and building the app

- [Shell and Navigation](shell.md) - Header navigation, the command palette, the settings menu, and feature flags
- [Development](development.md) - Running locally, mock mode, environment variables, regenerating the API client, and how the SPA is built and released

## See also

- [Keycloak Authentication for SmartEM SPA](../architecture/keycloak-spa-authentication.md) - How the SPA authenticates against Keycloak
- [Local Keycloak for SmartEM frontend dev](../development/local-keycloak.md) - Running a local Keycloak for frontend development
- [SmartEM Frontend: Design Specification](../decision-records/smartem-frontend-design.md) and [UX and Functional Requirements](../decision-records/smartem-frontend-requirements.md) - Original design intent (planning records; the pages above document the app as shipped)
