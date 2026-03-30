#!/usr/bin/env bash
# PostToolUse hook: run TypeScript type-check after editing .ts/.tsx files
set -euo pipefail

REPO_ROOT="$(pwd)"
INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('file_path',''))" 2>/dev/null || echo "")

if [[ "$FILE" == *.ts ]] || [[ "$FILE" == *.tsx ]]; then
    cd "$REPO_ROOT/app"
    echo "Running tsc on $FILE..."
    npx tsc --noEmit 2>&1 | head -60
fi
