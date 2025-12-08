# fandanGO-cryoem-dls Guidelines

## Overview

FandanGO plugin for depositing DLS cryo-EM metadata from SmartEM to ARIA. Part of the ARIA work package.

## Development Environment

- **Python Version**: 3.8+ (follows FandanGO ecosystem requirements)
- **Package Manager**: pip (no conda for this plugin, unlike fandanGO-core)
- **Dependencies**: fandanGO-core, fandanGO-aria (from FragmentScreen)

## Code Standards

- **No Emojis**: Consistent with SmartEM - no emojis in code, commits, or docs
- **British English**: Use British spelling in documentation
- **PEP 8**: Follow standard Python style
- **Type Hints**: Use where appropriate
- **Docstrings**: Required for public functions

## Project Structure

```
fandanGO-cryoem-dls/
├── fandango_dls/
│   ├── __init__.py              # Plugin class definition
│   ├── constants.py             # Action and config constants
│   ├── actions/
│   │   ├── generate_metadata.py # SmartEM extraction
│   │   ├── send_metadata.py     # ARIA submission
│   │   └── print_project.py     # Display project info
│   ├── db/
│   │   ├── sqlite.py            # Database connection
│   │   └── sqlite_db.py         # Database operations
│   └── utils/
│       └── smartem_client.py    # SmartEM API wrapper
├── setup.py
├── requirements.txt
├── config.yaml.template
└── .env.template
```

## Common Commands

```bash
# Install in development mode
pip install -e .

# Install with test dependencies
pip install -e ".[dev]"

# Run tests
pytest tests/

# Run with coverage
pytest --cov=fandango_dls tests/

# FandanGO CLI commands
fandango generate-metadata <project> --acquisition-id <uuid>
fandango send-metadata <project> --visit-id <id>
fandango print-project <project>
```

## Configuration

### config.yaml

```yaml
[DDBB]
DDBB_PATH = /path/to/FandanGOUserData

[SMARTEM]
API_URL = http://smartem-api.diamond.ac.uk:8000
```

### .env (ARIA credentials)

```bash
ARIA_CONNECTION_USERNAME=username
ARIA_CONNECTION_PASSWORD=password
ARIA_FACILITY_ID=facility_id
ARIA_CLIENT_SECRET=client_secret
```

## Dependencies

### Required (FragmentScreen)

- **fandanGO-core**: Plugin framework (`repos/FragmentScreen/fandanGO-core`)
- **fandanGO-aria**: ARIA integration (`repos/FragmentScreen/fandanGO-aria`)

### SmartEM Integration

Either install smartem-decisions or add to PYTHONPATH:

```bash
# Option 1: Install
pip install git+https://github.com/DiamondLightSource/smartem-decisions.git

# Option 2: PYTHONPATH
export PYTHONPATH=/path/to/smartem-decisions/src:$PYTHONPATH
```

## Architecture

```
SmartEM API (DLS) ──► fandanGO-cryoem-dls ──► ARIA (FragmentScreen)
     │                      │
     │ Extract              │ Load
     │                      │
     └──────► Transform ────┘
              (local SQLite)
```

**ETL Pattern:**
1. **Extract**: Fetch metadata from SmartEM REST API
2. **Transform**: Structure into ARIA-compatible DLS_CRYOEM schema
3. **Load**: Submit to ARIA with embargo controls

## Peer Reference

Similar facility plugins for reference patterns:
- `repos/FragmentScreen/fandanGO-cryoem-cnb` - CNB-CSIC Madrid (uses Scipion JSON)
- `repos/FragmentScreen/fandanGO-nmr-cerm` - CERM Florence NMR
- `repos/FragmentScreen/fandanGO-nmr-guf` - GUF Frankfurt NMR

Key difference: DLS plugin uses live REST API queries; CNB uses pre-generated JSON files.

## Testing

### With Mock SmartEM

For testing without SmartEM backend:
- Use testdata/ samples from ERIC workspace
- Mock SmartEMAPIClient responses

### With Real SmartEM

Requires:
- Network access to SmartEM API (DLS network/VPN)
- Valid acquisition UUIDs

## Troubleshooting

### SmartEM Connection

```bash
# Check API is reachable
curl http://smartem-api.diamond.ac.uk:8000/health

# Verify PYTHONPATH if using local smartem-decisions
python -c "from smartem_backend.api_client import SmartEMAPIClient; print('OK')"
```

### ARIA Connection

```bash
# Check credentials are set
env | grep ARIA

# Test ARIA connectivity (requires fandanGO-aria)
python -c "from aria.client import AriaClient; print('OK')"
```

## Claude Workflow

1. Check peer plugins in `repos/FragmentScreen/` for patterns when implementing new features
2. Ensure SmartEM API client changes align with smartem-decisions backend
3. Test metadata extraction with real acquisition UUIDs when possible
4. Follow FandanGO plugin conventions for new actions

## Contributing

- DLS is the authoritative source; FragmentScreen has a mirror
- All development and issue tracking in DiamondLightSource repo
- PRs should include tests for new functionality
