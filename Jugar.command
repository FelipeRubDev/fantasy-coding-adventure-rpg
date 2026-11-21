#!/bin/sh
# Doble clic (o ./Jugar.command) en macOS/Linux.
cd "$(dirname "$0")" || exit 1
if curl -s -m 2 -o /dev/null http://localhost:3000/api/health; then
  echo "El juego ya está abierto en http://localhost:3000"
  (xdg-open http://localhost:3000 || open http://localhost:3000) >/dev/null 2>&1 &
  exit 0
fi
(sleep 8; xdg-open http://localhost:3000 || open http://localhost:3000) >/dev/null 2>&1 &
node start.js