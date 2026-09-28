/**
 * hindsightService.js
 *
 * REAL integration with Hindsight (https://github.com/vectorize-io/hindsight),
 * the open-source agent memory system from Vectorize.io. This is the single
 * place in the codebase that talks to Hindsight — every controller only ever
 * calls the functions exported here.
 *
 * Hindsight organizes memory into "banks." SupportMind AI gives every
 * customer their own bank (bank_id = customer id), so each customer's
 * support history is isolated, exactly like the "Customer Memory" pages in
 * the UI expect.
 *
 * ───────────────────────────────────────────────────────────────────────
 * RUNNING REAL HINDSIGHT (pick one)
 * ───────────────────────────────────────────────────────────────────────
 *
 * A) Local, via Docker (recommended for the hackathon demo — free, no cloud account):
 *
 *      export OPENAI_API_KEY=sk-xxxx          # Hindsight needs an LLM to extract facts
 *      docker run --rm -it --pull always -p 8888:8888 -p 9999:9999 \
 *        -e HINDSIGHT_API_LLM_API_KEY=$OPENAI_API_KEY \
 *        -v $HOME/.hindsight-docker:/home/hindsight/.pg0 \
 *        ghcr.io/vectorize-io/hindsight:latest
 *
 *    API:  http://localhost:8888   (this is what HINDSIGHT_BASE_URL should point at)
 *    UI:   http://localhost:9999   (browse the raw memories Hindsight extracted —
 *                                    great to show judges as independent proof)
 *
 *    Leave HINDSIGHT_API_KEY blank in .env for local Docker mode (no auth needed).
 *
 * B) Hindsight Cloud (hosted, needs an account):
 *      1. Get a key at https://ui.hindsight.vectorize.io/connect
 *      2. Set in .env:
 *           HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
 *           HINDSIGHT_API_KEY=your-api-key
 *
 * Either way: `npm install` in /server pulls in @vectorize-io/hindsight-client,
 * and `npm run seed` (see scripts/seedHindsight.js) preloads the same demo
 * history the frontend ships with, so recall has something real to find.
 * ───────────────────────────────────────────────────────────────────────
 */

let HindsightClient;
try {
  ({ HindsightClient } = require("@vectorize-io/hindsight-client"));
} catch (e) {
  console.warn(
    "[hindsightService] @vectorize-io/hindsight-client is not installed yet.\n" +
    "  Run: npm install   inside /server, then restart the server."
  );
}

const BASE_URL = process.env.HINDSIGHT_BASE_URL || "http://localhost:8888";
const API_KEY = process.env.HINDSIGHT_API_KEY || undefined;

let client = null;
function getClient() {
  if (!HindsightClient) {
    throw new Error(
      "Hindsight client library not installed. Run `npm install` in /server."
    );
  }
  if (!client) {
    client = new HindsightClient({ baseUrl: BASE_URL, apiKey: API_KEY });
  }
  return client;
}

function bankFor(customerId) {
  // One bank per customer keeps each customer's memory isolated.
  return `supportmind-${customerId}`;
}

/** We store each experience as one structured sentence so recall can find it
 *  by issue, environment, or solution, and so we can parse it back into the
 *  {issue, environment, solution, outcome} shape the UI expects. */
function formatMemoryText({ issue, environment, solution, outcome }) {
  return `Support ticket resolved. Issue: ${issue}. Environment: ${environment || "unknown"}. Solution: ${solution}. Outcome: ${outcome || "Resolved"}.`;
}

function parseMemoryText(text) {
  const grab = (label) => {
    const m = text.match(new RegExp(label + ":\\s*(.*?)(?:\\.\\s*[A-Z][a-zA-Z]*:|\\.$)"));
    return m ? m[1].trim() : null;
  };
  return {
    issue: grab("Issue") || text.slice(0, 60),
    environment: grab("Environment") || "—",
    solution: grab("Solution") || "—",
    outcome: grab("Outcome") || "Resolved",
  };
}

/** All stored memories for a customer (used by the Customer Memory timeline). */
exports.getAll = async (customerId) => {
  const c = getClient();
  const result = await c.recall(bankFor(customerId), "support ticket history", { limit: 50 });
  return (result.results || []).map((r) => ({
    id: r.id || r.memory_id || String(Math.random()).slice(2),
    date: (r.occurred_at || r.created_at || "").slice(0, 10) || "unknown",
    ...parseMemoryText(r.text || ""),
  }));
};

/** Semantic recall for a specific issue — this is the "search Hindsight" step
 *  the AI Support page shows in the investigation flow. */
exports.search = async (customerId, query) => {
  const c = getClient();
  const result = await c.recall(bankFor(customerId), query, { limit: 5 });
  return (result.results || []).map((r) => ({
    id: r.id || r.memory_id || String(Math.random()).slice(2),
    date: (r.occurred_at || r.created_at || "").slice(0, 10) || "unknown",
    score: r.score,
    ...parseMemoryText(r.text || ""),
  }));
};

/** Called from "Save Experience to Hindsight" after a ticket is resolved —
 *  this is what makes the agent create new memory, not just recall old memory. */
exports.save = async (customerId, record) => {
  const c = getClient();
  const content = formatMemoryText(record);
  await c.retain(bankFor(customerId), content);
  return { id: "pending-index", date: new Date().toISOString().slice(0, 10), ...record };
};

exports._bankFor = bankFor; // exported for the seed script
