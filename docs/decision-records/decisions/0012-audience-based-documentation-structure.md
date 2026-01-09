# 12. Audience-Based Documentation Structure

Date: 2026-01-06

## Status

Accepted

## Context

The SmartEM documentation inherited a Diataxis framework (Tutorials, How-To, Explanations, Reference) from the Python Copier template. While Diataxis is well-regarded for general-purpose documentation, it presents challenges for our specific context:

### Problems with Diataxis for SmartEM

1. **Audience ambiguity**: A "How-To" guide doesn't indicate whether it's for developers, operators, or integrators. Users must read content to determine relevance.

2. **Component fragmentation**: Information about the Agent is scattered across how-to guides, explanations, and reference sections, requiring navigation across multiple directories.

3. **Use-case disconnect**: Common tasks like "deploy to production" or "debug agent issues" span multiple Diataxis categories, creating friction for users with specific goals.

4. **Growing complexity**: As the system expands to multiple components (Backend, Agent, Athena, Frontend), generic categories become insufficient.

### Requirements

- Clear entry points for different audiences (developers, operators, integrators)
- Component-focused documentation that groups related information
- Use-case driven organisation that matches how users approach the system
- Scalable structure as new components are added

## Decision

We will restructure documentation around three axes:

1. **Audience**: Developers, Operators, Integrators
2. **Component**: Backend, Agent, Athena (and future components)
3. **Use-Case**: Getting Started, Operations, Development, Architecture

### Target Structure

```
docs/
├── getting-started/       # Entry points by audience
│   ├── for-developers.md
│   ├── for-operators.md
│   └── for-integrators.md
├── backend/               # Backend component
│   ├── api-server.md
│   ├── database.md
│   └── messaging.md
├── agent/                 # Agent component
│   ├── cli-reference.md
│   ├── deployment.md
│   └── epu-integration.md
├── athena/                # Athena integration
│   ├── api-reference.md
│   └── mock-server.md
├── operations/            # Cross-cutting operations
│   ├── kubernetes.md
│   └── environment-variables.md
├── development/           # Contributing, testing
│   ├── contributing.md
│   └── testing.md
├── architecture/          # Design docs and ADRs
│   ├── system-design.md
│   └── decisions/
└── api/                   # Generated API docs
```

### Structure Principles

- Top-level directories reflect components and cross-cutting concerns
- Each section includes audience indicators where content differs by role
- ADRs remain in `/decision-records/decisions/` as the authoritative location
- API reference docs (Swagger/OpenAPI) remain generated and auto-published

## Consequences

### Positive

- **Clear navigation**: Users can quickly find content relevant to their role
- **Component coherence**: All Agent docs in one place, all Backend docs together
- **Scalable**: New components get new directories without restructuring
- **Reduced duplication**: Shared concepts documented once, linked from context

### Negative

- **Migration effort**: Existing docs must be reorganised and some rewritten
- **Link breakage**: External links to old structure will break (redirects needed)
- **Learning curve**: Contributors must understand new structure

### Migration Notes

- Existing content will be reorganised, not discarded
- Sphinx configuration will be updated for new structure
- WebUI will require corresponding updates (separate task)
