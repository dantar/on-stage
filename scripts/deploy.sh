#!/usr/bin/env bash
# Build the on-stage app and publish it to the dantar VPS.
#
# Usage: scripts/deploy.sh [-n|--dry-run]
#   -n, --dry-run   build, then show what rsync would change without uploading
#
# Overridable via environment: REMOTE, REMOTE_DIR, URL.
# No container restart is needed: /opt/web/onstage/html is a bind mount
# served directly by the `onstage` nginx container.
set -euo pipefail

REMOTE="${REMOTE:-dantar}"
REMOTE_DIR="${REMOTE_DIR:-/opt/web/onstage/html/}"
URL="${URL:-https://onstage.dantar.it}"

DRY_RUN=0
case "${1:-}" in
  -n|--dry-run) DRY_RUN=1 ;;
  -h|--help) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
  "") ;;
  *) echo "Unknown option: $1" >&2; exit 2 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../on-stage" && pwd)"

step() { printf '\n==> %s\n' "$*"; }

cd "$PROJECT_DIR"

step "Git state"
if git rev-parse --verify -q HEAD >/dev/null; then
  echo "Commit: $(git log -1 --format='%h %s')"
else
  echo "Commit: (no commits yet)"
fi
if [[ -n "$(git status --porcelain -- .)" ]]; then
  echo "WARNING: uncommitted changes in on-stage/ will be deployed." >&2
fi

step "Installing dependencies (npm ci)"
npm ci

step "Building (type-check + vite build)"
npm run build

if [[ ! -f dist/index.html ]]; then
  echo "ERROR: dist/index.html not found, aborting." >&2
  exit 1
fi

RSYNC_OPTS=(-avz --delete)
if (( DRY_RUN )); then
  RSYNC_OPTS+=(--dry-run)
  step "Dry run: changes rsync would make on $REMOTE:$REMOTE_DIR"
else
  step "Uploading dist/ to $REMOTE:$REMOTE_DIR"
fi
rsync "${RSYNC_OPTS[@]}" dist/ "$REMOTE:$REMOTE_DIR"

if (( DRY_RUN )); then
  step "Dry run complete, nothing uploaded"
  exit 0
fi

step "Smoke test: $URL"
status="$(curl -sS -o /dev/null -w '%{http_code}' "$URL" || true)"
if [[ "$status" == "200" ]]; then
  echo "OK (HTTP $status)"
else
  echo "ERROR: $URL returned HTTP ${status:-none}" >&2
  exit 1
fi

step "Deployed"
