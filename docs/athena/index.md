# Athena Integration

Documentation for ThermoFisher Athena API integration.

## API Reference

The Athena Decision Service API specification is available in the API documentation:

- [Athena API Docs](../api/athena/index.html) - Interactive Swagger UI
- [API Documentation Guide](../backend/api-documentation.md) - How to use the interactive documentation

## Mock Server

For local development without access to a real Athena service:

```bash
# Install mock dependencies
pip install -e ".[mock]"

# Start the Athena mock server
python -c "
from athena_api.mock import AthenaAPIServer
server = AthenaAPIServer()
server.run()
"

# Visit http://localhost:8000/docs
```

See the [API Documentation](../backend/api-documentation.md#mock-server-for-development) guide for more details.
