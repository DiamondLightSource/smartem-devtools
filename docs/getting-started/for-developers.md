# Installation

## Check Your Version of Python

SmartEM Decisions requires Python 3.12 or later for optimal performance and access to modern typing features. You can check your current Python version by entering the following command in a terminal:

```bash
python3 --version
```

**Note:** The project specifically requires Python 3.12+ to utilise advanced typing features and maintain compatibility with the latest scientific computing libraries.

## Install uv (Recommended)

We recommend using [uv](https://docs.astral.sh/uv/) for Python package management. uv is a fast Python package manager that handles virtual environments and dependencies efficiently.

### Install uv

```bash
# On macOS and Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or with pip
pip install uv

# Or with Homebrew (macOS)
brew install uv
```

## Installing the Library

### Development Installation (Recommended)

For development work, clone the repository and install using uv:

```bash
# Clone the repository
git clone https://github.com/DiamondLightSource/smartem-decisions.git
cd smartem-decisions

# Install all dependencies (creates virtual environment automatically)
uv sync --extra all
```

This will create a `.venv` directory and install all dependencies including development tools.

### Running Commands

With uv, prefix commands with `uv run` to execute them in the virtual environment:

```bash
# Run tests
uv run pytest

# Type checking
uv run pyright src tests

# Linting
uv run ruff check
```

### Standard Installation (pip)

You can also install the library using pip:

```bash
python3 -m pip install smartem-decisions
```

### Installation with Optional Dependencies

Install with specific feature sets:

```bash
# Using uv (recommended)
uv sync --extra mcp      # Install with MCP support
uv sync --extra all      # Install with all dependencies

# Using pip
pip install -e .[mcp]    # Install with MCP support
pip install -e .[all]    # Install with all dependencies
```

## Verify Installation

Verify that all components are correctly installed by running:

```bash
# Test core functionality
uv run python -c "import smartem_backend, smartem_agent, smartem_common; print('Core components imported successfully')"

# Test MCP functionality (if installed with MCP support)
uv run python -c "import smartem_mcp; print('MCP components available')"
```

You can also verify the CLI tools are available:

```bash
# Check agent CLI is accessible
uv run python -m smartem_agent --help
```

## Next Steps

Once installation is complete, you can proceed to:

- [Run the backend service](../backend/api-server.md)
- [Deploy using containers](../operations/run-container.md)
- [Set up the development environment](../development/tools.md)
- [Configure logging](../operations/logging.md)
