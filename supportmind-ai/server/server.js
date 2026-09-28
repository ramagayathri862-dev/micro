/**
 * SupportMind AI — backend + static host for the client.
 * `npm start` -> http://localhost:4000 serves the app AND the API.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");

const customerRoutes = require("./routes/customerRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const aiRoutes = require("./routes/aiRoutes");
const memoryRoutes = require("./routes/memoryRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Reports what's live so the sidebar badge stays honest.
app.get("/health", async (req, res) => {
  const out = { api: "ok", groq: !!process.env.GROQ_API_KEY, hindsight: "unreachable" };
  try {
    await require("./services/hindsightService").getAll("health-check");
    out.hindsight = "connected";
  } catch (err) {
    out.detail = err.message;
  }
  res.json(out);
});

app.use("/api/customers", customerRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/memory", memoryRoutes);

app.use(express.static(path.join(__dirname, "..", "client")));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\nSupportMind AI running → http://localhost:${PORT}`);
  console.log(`Groq key:  ${process.env.GROQ_API_KEY ? "found" : "NOT set (scripted recommendations)"}`);
  console.log(`Hindsight: ${process.env.HINDSIGHT_BASE_URL || "http://localhost:8888"}\n`);
});
