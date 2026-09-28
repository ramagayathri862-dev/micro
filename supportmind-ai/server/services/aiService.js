/**
 * aiService.js
 *
 * Turns (issue + memories recalled from Hindsight) into a recommendation.
 * If GROQ_API_KEY is set and the groq-sdk package is installed, this calls
 * the real Groq LLM. Otherwise it falls back to clear, deterministic logic
 * so the app still works with zero API keys configured.
 */

let Groq;
try {
  Groq = require("groq-sdk");
} catch (e) {
  // groq-sdk not installed — fine, we fall back below.
}

function scriptedRecommendation({ issue, environment, memories }) {
  if (memories.length > 0) {
    const best = memories[0];
    return {
      summary: `This issue closely matches a previous "${best.issue}" case, resolved with: ${best.solution}.`,
      actions: [
        `Confirm the customer is still on ${best.environment}`,
        `Apply the previous fix: ${best.solution}`,
        `Retry the action that triggered "${issue}"`,
        `If unresolved, escalate and inspect application logs`,
      ],
    };
  }
  return {
    summary: `No matching history found for "${issue}". Treating this as a new issue.`,
    actions: [
      `Reproduce the issue on ${environment || "the reported environment"}`,
      `Check application logs for related errors`,
      `Try standard fixes: clear cache, update browser/app`,
      `Document the resolution so Hindsight can recall it next time`,
    ],
  };
}

exports.recommend = async ({ issue, environment, memories }) => {
  if (!process.env.GROQ_API_KEY || !Groq) {
    return scriptedRecommendation({ issue, environment, memories });
  }

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a customer support AI. You are given a customer's current issue and any relevant memories " +
            "of their past resolved issues (recalled from Hindsight, their long-term memory system). " +
            "Respond ONLY with strict JSON: {\"summary\": string, \"actions\": string[]} — a one-sentence summary " +
            "of your reasoning, and 3-5 concrete, numbered-style next actions. If memories are relevant, ground " +
            "your recommendation in the specific past solution. If no memories are relevant, say so and recommend " +
            "a fresh investigation.",
        },
        {
          role: "user",
          content: JSON.stringify({ issue, environment, memories }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    if (parsed.summary && Array.isArray(parsed.actions)) return parsed;
    throw new Error("Malformed model response");
  } catch (err) {
    console.warn("[aiService] Groq call failed, falling back to scripted recommendation:", err.message);
    return scriptedRecommendation({ issue, environment, memories });
  }
};
