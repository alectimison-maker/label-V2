#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REQUESTED_PORT="${1:-8765}"

find_free_port() {
  local port="$1"
  while port_in_use "${port}"; do
    port="$((port + 1))"
  done
  printf '%s\n' "${port}"
}

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "( sport = :${port} )" | tail -n +2 | grep -q .
    return
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
    return
  fi

  netstat -an 2>/dev/null | grep -E "[\\.:]${port}[[:space:]].*LISTEN" >/dev/null 2>&1
}

PORT="$(find_free_port "${REQUESTED_PORT}")"

echo "Serving ${ROOT_DIR}"
if [[ "${PORT}" != "${REQUESTED_PORT}" ]]; then
  echo "Port ${REQUESTED_PORT} is busy, switched to ${PORT}"
fi
echo "Open http://127.0.0.1:${PORT}"

cd "${ROOT_DIR}"
exec python3 -m http.server "${PORT}" --bind 127.0.0.1
