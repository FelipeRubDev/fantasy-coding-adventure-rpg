@echo off
curl -s -m 2 http://localhost:3000/api/health >nul 2>&1 && (
  echo El juego ya esta abierto en http://localhost:3000
  start http://localhost:3000
  exit /b 0
)
echo Iniciando El Codice Borrado...
start "" http://localhost:3000
node start.js
pause