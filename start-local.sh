#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REQUESTED_PORT="${1:-8765}"

find_free_port() {
  local port="$1"
  while ss -ltn "( sport = :${port} )" | tail -n +2 | grep -q .; do
    port="$((port + 1))"
  done
  printf '%s\n' "${port}"
}

PORT="$(find_free_port "${REQUESTED_PORT}")"

echo "Serving ${ROOT_DIR}"
if [[ "${PORT}" != "${REQUESTED_PORT}" ]]; then
  echo "Port ${REQUESTED_PORT} is busy, switched to ${PORT}"
fi
echo "Open http://127.0.0.1:${PORT}"

cd "${ROOT_DIR}"
exec python3 -m http.server "${PORT}" --bind 127.0.0.1
