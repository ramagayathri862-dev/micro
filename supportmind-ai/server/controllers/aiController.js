const hindsightService = require("../services/hindsightService");
const aiService = require("../services/aiService");

/**
 * Investigation: recall memory -> recommend.
 * Prefers real Hindsight. If Hindsight is unreachable, reasons over the memories the
 * client sent (localMemories) so the Groq key is still put to use.
 */
exports.investigate = async (req, res) => {
  const { ticketId } = req.params;
  const { customerId, issue, environment, localMemories } = req.body;

  if (!customerId || !issue) {
    return res.status(400).json({ error: "customerId and issue are required" });
  }

  let memories = [];
  let source = "hindsight";
  try {
    memories = await hindsightService.search(customerId, issue);
  } catch (err) {
    console.warn("[aiController] Hindsight unreachable, using client memories:", err.message);
    memories = Array.isArray(localMemories) ? localMemories : [];
    source = "local-memory";
  }

  const recommendation = await aiService.recommend({ issue, environment, memories });
  res.json({
    ticketId,
    memoriesFound: memories.length,
    memories,
    recommendation,
    source,
    aiSource: process.env.GROQ_API_KEY ? "groq" : "scripted",
  });
};
