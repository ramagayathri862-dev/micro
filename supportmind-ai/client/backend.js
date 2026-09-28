/* =========================================================
   SupportMind AI — Backend Connector
   - Served by the backend (http://localhost:4000): same-origin calls.
   - Opened via Live Server / file: calls http://localhost:4000.
   If the backend is unreachable, everything falls back to the local
   demo store in data.js, so the app always works.
   ========================================================= */

const BACKEND_URL = location.port === "4000" ? "" : "http://localhost:4000";
let backendAvailable = false;
let hindsightConnected = false;
let groqEnabled = false;

async function checkBackend() {
  try {
    const res = await fetch(BACKEND_URL + "/health");
    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    backendAvailable = true;
    hindsightConnected = data.hindsight === "connected";
    groqEnabled = !!data.groq;
  } catch (e) {
    backendAvailable = false;
    hindsightConnected = false;
    groqEnabled = false;
  }
  updateBackendBadge();
}

function updateBackendBadge() {
  const el = document.getElementById("backend-badge");
  if (!el) return;
  if (backendAvailable && hindsightConnected) {
    el.textContent = "🟢 Live Hindsight" + (groqEnabled ? " + Groq" : "") + " connected";
    el.style.color = "var(--good)";
  } else if (backendAvailable) {
    el.textContent = "🟡 Backend up" + (groqEnabled ? ", Groq live" : "") + ", Hindsight offline";
    el.style.color = "var(--warn)";
  } else {
    el.textContent = "⚪ Local demo mode";
    el.style.color = "var(--text-dim)";
  }
}

async function beFetch(path, opts) {
  const res = await fetch(BACKEND_URL + path, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || ("Backend error " + res.status));
  }
  return res.json();
}

/** Ask the backend to investigate. It uses real Hindsight if reachable; otherwise it
 *  reasons over the local memories we send along (still using Groq if configured).
 *  Returns null on failure so the caller falls back to the local simulation. */
async function tryBackendInvestigate(ticket, customer) {
  if (!backendAvailable) return null;
  try {
    return await beFetch(`/api/ai/investigate/${ticket.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customer.id,
        issue: ticket.issue,
        environment: ticket.environment,
        localMemories: DB.searchMemory(customer.id, ticket.issue),
      }),
    });
  } catch (e) {
    console.warn("Backend investigate failed, using local demo memory instead:", e.message);
    return null;
  }
}

/** Best-effort mirror of a saved experience into real Hindsight. */
function mirrorSaveToBackend(customerId, record) {
  if (!backendAvailable || !hindsightConnected) return;
  beFetch(`/api/memory/${customerId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  }).catch((e) => console.warn("Could not mirror save to Hindsight:", e.message));
}

document.addEventListener("DOMContentLoaded", () => {
  checkBackend();
  setInterval(checkBackend, 15000);
});
