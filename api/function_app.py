"""Azure Functions entry point.

Wraps the FastAPI application so it can be served by the Azure Functions
Python v2 programming model.
"""

import azure.functions as func

from main import create_app

app = create_app()

# Expose the ASGI app to the Azure Functions host.
# The route is "/{*route}" so every inbound request is forwarded to FastAPI.
function_app = func.AsgiFunctionApp(app=app, http_auth_level=func.AuthLevel.ANONYMOUS)
