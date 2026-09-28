@echo off
cd /d "%~dp0"

if not exist .env (
  copy .env.example .env >nul
  echo.
  echo  First run: paste your GROQ_API_KEY into the .env file that is about to open,
  echo  save it, close Notepad, then run start.bat again.
  echo  Free key: https://console.groq.com/keys
  notepad .env
  pause
  exit /b
)

echo Starting Hindsight memory server (Docker)...
docker compose up -d
if errorlevel 1 (
  echo.
  echo  Docker is not running or not installed. Continuing without real Hindsight.
  echo  The app still works: Groq + local memory. Install Docker Desktop to enable Hindsight.
  echo.
)

cd server
call npm install
echo Seeding demo history into Hindsight (skips automatically if already done)...
call npm run seed
echo.
echo Opening http://localhost:4000
start "" http://localhost:4000
call npm start
