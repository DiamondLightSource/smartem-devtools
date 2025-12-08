---
name: Technical Writer
description: Documentation creation, ADRs, READMEs, British English standards, and Markdown formatting
version: 1.0.0
tags: [documentation, adr, readme, markdown, british-english]
---

# Technical Writer Skill

Documentation creation and maintenance following British English conventions and project standards.

## When to Use

- Creating or updating documentation
- Writing Architecture Decision Records (ADRs)
- Updating README files
- Reviewing docs for style consistency
- Creating user guides or API documentation

## Critical Rules

1. **British English** - Use British spelling and grammar:
   - colour, behaviour, realise, organisation, centre, licence (noun)
   - "whilst" not "while", "amongst" not "among"
   - Preserve American spellings in code identifiers and technical terms

2. **No Emojis** - Never use emojis or unicode symbols in documentation
   - Reason: Windows binary compilation issues with charmap encoding

3. **Line Length** - Maximum 120 characters per line (matches ruff config)

4. **Active Voice** - Prefer active voice for clarity

5. **No Jargon Without Explanation** - Define technical terms on first use

## Architecture Decision Records (ADRs)

### Location

```
repos/DiamondLightSource/smartem-decisions/docs/explanations/decisions/
```

### Naming Convention

```
NNNN-short-descriptive-title.md
```

Where NNNN is the next sequential number. Check existing files:

```bash
ls repos/DiamondLightSource/smartem-decisions/docs/explanations/decisions/ | tail -1
```

### ADR Template

```markdown
# N. Title of Decision

## Status

Proposed | Accepted | Deprecated | Superseded by [NNNN](NNNN-title.md)

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?
```

### ADR Example

```markdown
# 6. Use RabbitMQ for Message Queue

## Status

Accepted

## Context

The SmartEM system requires asynchronous communication between the backend API, processing
services, and ML decision plugins. We need a message broker that supports:

- Reliable message delivery
- Multiple consumers per queue
- Integration with existing DLS infrastructure

## Decision

We will use RabbitMQ as the message broker for all inter-service communication.

- Use pika library for Python integration
- Messages use JSON format with Pydantic validation
- Queue names follow pattern: `smartem_{service}_{action}`

## Consequences

- Decouples services, enabling independent scaling
- Adds operational complexity (RabbitMQ cluster management)
- Requires message schema versioning strategy
- Aligns with cryoem-services which already uses RabbitMQ
```

### Create New ADR

```bash
# Check next number
NEXT=$(ls repos/DiamondLightSource/smartem-decisions/docs/explanations/decisions/*.md | wc -l)
NEXT=$((NEXT + 1))
PADDED=$(printf "%04d" $NEXT)

# Create file
cat > "repos/DiamondLightSource/smartem-decisions/docs/explanations/decisions/${PADDED}-your-title.md" << 'EOF'
# N. Title

## Status

Proposed

## Context

[Describe the context]

## Decision

[Describe the decision]

## Consequences

[Describe consequences]
EOF
```

## README Updates

### Structure for Project READMEs

```markdown
# Project Name

Brief one-line description.

## Overview

2-3 paragraphs explaining what this project does and why.

## Installation

Step-by-step installation instructions.

## Usage

Common usage examples with code blocks.

## Development

How to set up for development, run tests, etc.

## Architecture

Brief overview or link to detailed docs.

## Contributing

How to contribute, coding standards, PR process.

## Licence

Licence information.
```

### README Best Practices

- Start with what, not how
- Include badges for CI status, coverage, version
- Provide copy-pasteable commands
- Link to detailed documentation
- Keep it scannable (headers, bullets, code blocks)

## Sphinx Documentation

### Build Commands

```bash
cd repos/DiamondLightSource/smartem-decisions

# Full build
sphinx-build -E docs build/html

# Live reload during writing
sphinx-autobuild docs build/html

# Check links
sphinx-build -b linkcheck docs build/linkcheck
```

### Adding New Pages

1. Create `.md` file in appropriate `docs/` subdirectory
2. Add to `toctree` in parent `index.md`
3. Use MyST Markdown syntax

### MyST Markdown Features

```markdown
# Headings use standard Markdown

Code blocks with syntax highlighting:
```python
def example():
    pass
```

Admonitions:
```{note}
This is a note.
```

```{warning}
This is a warning.
```

Cross-references:
{ref}`label-name`
{doc}`path/to/document`
```

## Common British vs American Spellings

| British | American |
|---------|----------|
| colour | color |
| behaviour | behavior |
| organisation | organization |
| realise | realize |
| analyse | analyze |
| centre | center |
| licence (noun) | license |
| programme | program |
| whilst | while |
| amongst | among |
| towards | toward |
| grey | gray |

**Exception**: Keep American spellings in:
- Code identifiers (`color` in CSS, `behavior` in APIs)
- Library/tool names
- Direct quotes from American sources

## Style Checklist

Before finalising documentation:

- [ ] British English spelling throughout
- [ ] No emojis or unicode decorations
- [ ] Line length under 120 characters
- [ ] Active voice where possible
- [ ] Code examples have syntax highlighting
- [ ] Links are valid and descriptive
- [ ] Headers follow logical hierarchy
- [ ] Technical terms defined on first use
- [ ] Consistent terminology throughout

## References

- ADR format: https://adr.github.io/
- MyST Markdown: https://myst-parser.readthedocs.io/
- Sphinx: https://www.sphinx-doc.org/
