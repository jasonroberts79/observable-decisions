#!/usr/bin/env python3
"""PreToolUse hook: block edits to .env files containing secrets."""
import sys
import json

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

file_path = data.get("file_path", "")
name = file_path.rsplit("/", 1)[-1]

# Block .env, .env.local, .env.production — allow .env.example
if name.startswith(".env") and name not in (".env.example", ".env.sample"):
    print(f"BLOCKED: Refusing to edit sensitive env file: {file_path}", file=sys.stderr)
    print("Edit .env files manually outside of Claude to avoid accidental secret exposure.")
    sys.exit(2)
