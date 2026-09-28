#!/usr/bin/env bash
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "First run: paste your GROQ_API_KEY into .env (free key: https://console.groq.com/keys), then run ./start.sh again."
  exit 0
fi

echo "Starting Hindsight memory server (Docker)..."
docker compose up -d || echo "Docker unavailable — continuing without real Hindsight (Groq + local memory still work)."

cd server
npm install
npm run seed
echo "Open http://localhost:4000"
npm start
