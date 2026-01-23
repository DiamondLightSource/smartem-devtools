# SmartEM Decisions Project Guidelines

## Development Environment
- **Python Version**: 3.12+ (strict requirement - utilize modern typing features)
- **Package Manager**: uv (https://docs.astral.sh/uv/)
- **Package Management**: Use `uv sync --extra all` for full development setup
- **Code Style**: Ruff (120 char line length) with pyright type checking

## Code Standards
- **MANDATORY PRE-COMMIT WORKFLOW**: After creating or modifying ANY file, immediately run
  `pre-commit run --files <files>` and fix all issues. This is not optional - no task is complete until pre-commit
  passes cleanly
- **New line at end of file**: All files must end with a newline (pre-commit enforces this)
- **No Comments**: Code should be self-explanatory - avoid explanatory comments
- **ABSOLUTELY NO EMOJIS OR UNICODE SYMBOLS**: Never use emojis, font icons, or special Unicode characters anywhere:
  - Not in Python code (source files, strings, comments)
  - Not in print statements or logging messages
  - Not in documentation (Markdown, RST, docstrings)
  - Not in commit messages or PR descriptions
  - Not in configuration files or scripts
  - Reason: Windows binary compilation uses 'charmap' encoding which causes runtime crashes with Unicode characters
  - Use plain ASCII text only (brackets, dashes, and standard punctuation are fine)
- **Modern Python**: Use Python 3.12 typing features (no legacy `typing` imports where unnecessary)
- **Line Length**: 120 characters maximum (ruff enforces this)
- **Import Sorting**: Use ruff's import sorting (I001 rule)
- **Type Annotations**: Use modern `dict[str, Any]` not `Dict[str, Any]` (UP006, UP007 rules)
- **XML Parsing**: Use lxml for all XML processing needs
- **CLI Tools**: Prefer rich/typer for beautiful command-line interfaces
- **Pattern Matching**: Use Python 3.12+ `match`/`case` instead of long `elif` chains when dispatching on string literals or enums

## Claude Workflow Requirements
Claude must follow this exact sequence for ANY file creation or modification:
1. Create/modify file using Write, Edit, or MultiEdit tools
2. IMMEDIATELY run `pre-commit run --files <modified-files>`
3. Fix any issues found by pre-commit
4. Re-run pre-commit until all checks pass
5. Only then consider the task complete

This applies to ALL files: Python code, Markdown documentation, configuration files, agent definitions, etc.

## Common Commands
```bash
# Development setup
uv sync --extra all

# Testing
uv run pytest

# Type checking
uv run pyright src tests

# Linting and formatting
uv run ruff check
uv run ruff format

# Pre-commit checks
pre-commit run --all-files

# Documentation (see smartem-devtools webui)
cd ../smartem-devtools/webui && npm run dev

# Database migrations
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "Description"
```

## Project Architecture
- **Multi-package structure**: `smartem_backend`, `smartem_agent`, `smartem_common`, `athena_api`
- **Scientific computing focus**: Cryo-electron microscopy workflow automation
- **Microservices**: FastAPI backend with message queue (RabbitMQ) communication
- **Database**: PostgreSQL with SQLModel/Alembic migrations
- **Containerized deployment**: Kubernetes-ready with multi-environment configs

## Architectural Boundaries

### athena_api usage
- `athena_api` package is for **Agent use only**
- Backend (`consumer.py`, `api_server.py`) must NOT import `athena_api`
- If you need to send data to the microscope, route through Agent via SSE
- See `claude-config/ARCHITECTURE.md` for full separation of concerns documentation

## Scientific Domain Context
- **Cryo-EM workflows**: Real-time microscopy data processing and decision making
- **High-throughput**: Handle high-frequency processing requirements
- **Research reproducibility**: Maintain data provenance and scientific rigor
- **Open source**: Apache 2.0 licensed research software

## Testing & Quality
- **Coverage**: Tests run with coverage reporting
- **Doctests**: Documentation examples are executable
- **CI/CD**: GitHub Actions with pre-commit hooks

## Documentation
- **Markdown**: Documentation in `docs/` synced to smartem-devtools webui as MDX
- **API documentation**: Swagger/OpenAPI specs auto-generated
- **Live development**: Run `npm run dev` in smartem-devtools/webui for hot-reload

## Available Skills

Skills are available in `claude-config/shared/skills/` - see each SKILL.md for detailed usage:

- **database-admin**: PostgreSQL, Alembic migrations, schema validation, query templates
- **devops**: Kubernetes, containers, CI/CD workflows, GitHub Actions debugging
- **technical-writer**: Documentation, ADRs, British English standards, Markdown formatting
- **git**: Commits, branches, rebasing, history management
- **github**: PRs, issues, project boards, releases, CI/CD debugging

For frontend work, see `claude-config/smartem-frontend/skills/`:
- **playwright-skill**: Browser automation and testing

## Dependencies of Note
- **Web**: FastAPI, uvicorn, httpx, requests
- **Data**: Pydantic v2, SQLModel, lxml, watchdog
- **Scientific**: Designed for (but not exclusive to) Diamond Light Source facility integration
- **Monitoring**: Rich CLI output, structured logging support
