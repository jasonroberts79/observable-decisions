---
name: run-tests
description: Run the backend pytest test suite for the Observable Decisions API
---

Run the backend tests and report results:

```bash
cd api && uv run pytest tests/ -v --tb=short
```

If tests fail, identify which tests failed, what the assertion or error is, and which file/line is relevant. Do not suggest fixes unless asked — just report what failed.
