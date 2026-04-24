#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-80}"
HOST="${HOST:-http://127.0.0.1:${PORT}}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
START_TIMEOUT_SECONDS="${START_TIMEOUT_SECONDS:-120}"
ENV_FILE="${ENV_FILE:-.env}"

cd "$ROOT_DIR"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Erro: docker não encontrado no PATH."
  exit 1
fi

if ! command -v ngrok >/dev/null 2>&1; then
  echo "Erro: ngrok não encontrado no PATH."
  exit 1
fi

if [[ -n "${NGROK_AUTHTOKEN:-}" ]]; then
  ngrok config add-authtoken "$NGROK_AUTHTOKEN" >/dev/null
fi

echo "Subindo docker compose..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo "Aguardando app responder em ${HOST}..."
for ((i=1; i<=START_TIMEOUT_SECONDS; i++)); do
  if curl -fsS "$HOST" >/dev/null 2>&1; then
    echo "App disponível em ${HOST}"
    break
  fi

  if [[ "$i" -eq "$START_TIMEOUT_SECONDS" ]]; then
    echo "Erro: timeout aguardando app responder em ${HOST}"
    exit 1
  fi

  sleep 1
done

echo "Abrindo túnel do ngrok para a porta ${PORT}..."
if [[ -n "${NGROK_DOMAIN:-}" ]]; then
  exec ngrok http --domain="$NGROK_DOMAIN" "$PORT"
else
  exec ngrok http "$PORT"
fi
