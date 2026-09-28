/**
 * scripts/seedHindsight.js
 *
 * Preloads the same demo customer history the frontend ships with into a
 * REAL running Hindsight instance, so `npm run seed` gives you something
 * genuine for the AI Support flow to recall on your very first demo ticket
 * (instead of an empty bank).
 *
 * Requires Hindsight to already be running (see hindsightService.js header
 * for the Docker / Cloud setup commands) and HINDSIGHT_BASE_URL set.
 *
 * Run:
 *   cd server
 *   npm install
 *   npm run seed
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const MARKER = path.join(__dirname, "..", ".seeded");
const hindsightService = require("../services/hindsightService");

const demoHistory = {
  c1: [ // Ananya Sharma
    { issue: "Login problem", environment: "Chrome / Windows 11", solution: "Session reset", outcome: "Resolved" },
    { issue: "PDF upload problem", environment: "Chrome / Windows 11", solution: "Clear browser cache and update Chrome", outcome: "Resolved" },
    { issue: "Application crash", environment: "Chrome / Windows 11", solution: "Chrome update", outcome: "Resolved" },
    { issue: "Payment failure", environment: "Chrome / Windows 11", solution: "Retry with alternate card", outcome: "Resolved" },
  ],
  c2: [ // Rahul Kumar
    { issue: "Slow application load", environment: "Safari / macOS 15", solution: "Cleared local storage", outcome: "Resolved" },
  ],
  c3: [ // Priya Reddy
    { issue: "Payment issue", environment: "Edge / Windows 10", solution: "Refreshed payment token", outcome: "Resolved" },
  ],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function saveWithRetry(customerId, record) {
  for (let i = 1; i <= 20; i++) {
    try { return await saveWithRetry(customerId, record); }
    catch (err) { if (i === 20) throw err; process.stdout.write("w"); await sleep(3000); } // Hindsight may still be booting
  }
}

async function run() {
  if (fs.existsSync(MARKER) && !process.argv.includes("--force")) {
    console.log("Already seeded (delete server/.seeded or use --force to re-seed). Skipping.");
    return;
  }
  console.log(`Seeding Hindsight at ${process.env.HINDSIGHT_BASE_URL || "http://localhost:8888"} ...`);
  let count = 0;
  for (const customerId of Object.keys(demoHistory)) {
    for (const record of demoHistory[customerId]) {
      try {
        await saveWithRetry(customerId, record);
        count++;
        process.stdout.write(".");
      } catch (err) {
        console.error(`\nFailed to seed ${customerId}:`, err.message);
        console.error("Is Hindsight running? See the setup instructions at the top of services/hindsightService.js");
        process.exit(1);
      }
    }
  }
  fs.writeFileSync(MARKER, new Date().toISOString());
  console.log(`\nDone. Retained ${count} memories across ${Object.keys(demoHistory).length} customer banks.`);
  console.log("Hindsight needs a few seconds to finish extracting facts before recall picks them up.");
  console.log("Check them visually at the Hindsight UI (default http://localhost:9999) if running locally.");
}

run();
