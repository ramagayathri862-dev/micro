# SupportMind AI

**Customer support that remembers your customers — powered by Hindsight memory + Groq.**

## ⚡ Quick start (full working model)

Needs: Node.js 18+, and Docker Desktop (for real Hindsight; optional).

1. Unzip. Get a free key at https://console.groq.com/keys
2. **Windows:** double-click `start.bat` — first run opens `.env`; paste your key after `GROQ_API_KEY=`, save, run `start.bat` again.
   **Mac/Linux:** `./start.sh` (same first-run step).
3. Open **http://localhost:4000** — the sidebar badge should turn 🟢.

What the script does: starts Hindsight in Docker (using your Groq key), installs the backend, seeds demo memory, and serves the app + API on one port.

| Sidebar badge | Meaning |
|---|---|
| 🟢 Live Hindsight + Groq connected | Real memory recall + real LLM recommendations |
| 🟡 Backend up, Groq live, Hindsight offline | Docker not running; Groq reasons over local memory |
| ⚪ Local demo mode | Backend not running; zero-setup simulation |

Your key lives only in `.env` (git-ignored). Never commit it.

---
This is a complete, working demo build for the hackathon brief. It implements every
screen from the product spec (Dashboard, Customers, Tickets, Create Ticket, AI Support,
Conversation, Customer Memory, Memory Search, Knowledge, Analytics, Settings) as one
connected product loop, not disconnected pages.

## ▶️ Run it (no install needed)

The `client/` folder is a fully self-contained static web app — it needs **no build
step, no npm install, and no API keys** to run and demo live.

**Option A — just open it:**
Double-click `client/index.html` and it opens in your browser, fully working.

**Option B — serve it (recommended for the live demo):**
```bash
cd client
python3 -m http.server 5173
# then open http://localhost:5173
```
or
```bash
npx serve client
```

Data persists in the browser's `localStorage`, so anything you resolve/save during
the demo will still be there if you refresh — which is exactly what makes the
"customer comes back and the AI remembers" moment work live.

## 🧠 How Hindsight memory is used

This build has **two layers**, and it switches between them automatically —
no config needed to demo it either way:

1. **Local demo memory** (`client/data.js`) — a `localStorage`-backed store
   that always works, with zero setup, so the app runs the moment you open
   `index.html`. This is what judges see if they just open the file.
2. **Real Hindsight** (`server/services/hindsightService.js`) — genuine calls
   to [Hindsight](https://github.com/vectorize-io/hindsight), the open-source
   agent memory system from Vectorize.io, via `@vectorize-io/hindsight-client`.
   When you start the backend (see "Run with real Hindsight" below) **and**
   Hindsight itself is running, the sidebar badge switches to
   **🟢 Live Hindsight connected**, and the AI Support page's "Searching
   Hindsight memory" step genuinely calls Hindsight's `recall()` API instead
   of the local keyword match. Every "Save Experience to Hindsight" click
   also mirrors the resolution into a real Hindsight `retain()` call.

Concretely, in the real integration:

- **One memory bank per customer** (`bank_id = "supportmind-<customerId>"`)
  keeps each customer's history isolated, matching the "Customer Memory" page.
- **`hindsightService.search(customerId, query)`** calls Hindsight's `recall()`,
  which runs semantic + keyword + graph + temporal retrieval in parallel and
  returns the most relevant past experiences — this is the real "search
  Hindsight" step shown in the AI Support flow.
- **`hindsightService.save(customerId, record)`** calls Hindsight's `retain()`
  after a ticket is resolved — the agent creating new memory, not just
  recalling old memory.
- **`aiService.recommend(...)`** turns the recalled memories into a
  recommendation — using a real Groq LLM call if `GROQ_API_KEY` is set, or
  clear scripted logic otherwise.

### Run with real Hindsight

**1. Start Hindsight itself** (local Docker, free, no account needed):
```bash
export OPENAI_API_KEY=sk-xxxx   # Hindsight uses an LLM to extract facts from what you retain
docker run --rm -it --pull always -p 8888:8888 -p 9999:9999 \
  -e HINDSIGHT_API_LLM_API_KEY=$OPENAI_API_KEY \
  -v $HOME/.hindsight-docker:/home/hindsight/.pg0 \
  ghcr.io/vectorize-io/hindsight:latest
```
This gives you the API at `http://localhost:8888` and a UI at
`http://localhost:9999` where you can literally browse the memories your
demo creates — great independent proof for judges.

*(Prefer hosted? Get a key at https://ui.hindsight.vectorize.io/connect and
set `HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io` + `HINDSIGHT_API_KEY`
in `server/.env` instead of running Docker.)*

**2. Install and seed the backend:**
```bash
cd server
npm install
npm run seed               # preloads demo customer history into real Hindsight
npm start
```

**3. Run the frontend as usual** (see "Run it" above). Within ~15 seconds
the sidebar badge flips to 🟢, and the AI Support page is now backed by
real Hindsight recall.

If you skip steps 1–2, the app still works perfectly — it just stays in
🟢 local demo mode, which is exactly why judges can run it with zero setup.

### The proof-of-memory demo flow
1. Go to **Customers → Ananya Sharma** — she already has 4 resolved tickets and
   4 stored memories (PDF upload, login timeout, app crash, payment failure).
2. Go to **Create Ticket**, pick Ananya, and submit a new **PDF Upload Error**.
3. On the **AI Support** page, watch the agent: understand the issue → search
   Hindsight → surface the *matching prior PDF-upload memory* → give a
   recommendation built from that memory → resolve & save a *new* memory record.
4. Open **Conversation** for that ticket — the AI's first message references the
   specific prior fix ("clearing the Chrome cache resolved it last time").
5. Go to **Rahul Kumar** (no PDF history) and create a PDF-upload ticket for him —
   notice the AI explicitly says no matching memory was found, proving the recall
   is real and customer-specific, not scripted per-issue.

## 📁 Project structure

```
supportmind-ai/
├── client/                 # The working demo app (open index.html)
│   ├── index.html
│   ├── style.css
│   ├── data.js              # Demo data + Hindsight memory simulation (DB)
│   └── app.js                # Router + all page renderers + AI flow
├── server/                 # Production-shape backend stub (Node/Express)
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   │   ├── hindsightService.js
│   │   ├── aiService.js
│   │   └── customerService.js
│   └── .env.example
├── docs/
│   └── article.md           # 800–1,500 word content-contest article draft
└── README.md
```

## 🛠️ Tech stack

| Layer | Zero-setup mode | With backend + Hindsight running |
|---|---|---|
| Frontend | Vanilla HTML/CSS/JS (zero-install) | same, auto-upgrades via `backend.js` |
| Backend | — (all client-side) | Node.js + Express (`server/`) |
| AI | Scripted recommendation logic | Groq LLM (if `GROQ_API_KEY` set), else scripted |
| Memory | `localStorage`-backed `DB` object | **Real Hindsight** (`@vectorize-io/hindsight-client`) |
| Database | In-browser store | MongoDB (see `server/services/customerService.js` for the swap point) |
| Deployment | Any static host | Vercel (frontend) + Render/Railway (backend) + Hindsight Cloud or self-hosted Docker |

`client/backend.js` does a `/health` check against the backend on load and
every 15s, and only routes the AI flow through real Hindsight when it's
actually reachable — otherwise everything transparently uses the local store.
This means the same zip works as a zero-setup static demo *and* a real,
Hindsight-backed system, without a build flag or config switch.

**Never commit real API keys.** Copy `server/.env.example` to `server/.env` and
fill in your own Hindsight/Groq credentials locally — `.env` is git-ignored.

## 📦 Hackathon submission checklist

- [x] GitHub-ready repository structure (this zip)
- [x] Working live demo (`client/index.html`, no install required)
- [x] Real Hindsight integration (`server/services/hindsightService.js` + `npm run seed`)
- [ ] Demo video (2–5 min) — record a walkthrough of the flow above
- [ ] 800–1,500 word technical article — draft in `docs/article.md`, personalize and publish
- [ ] LinkedIn post promoting the article
- [ ] Explanation of how Hindsight memory is used — see "How Hindsight memory is used" above, reuse for submission form
