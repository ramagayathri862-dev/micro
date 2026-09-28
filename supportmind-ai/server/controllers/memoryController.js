const hindsightService = require("../services/hindsightService");

exports.getMemory = async (req, res) => {
  try {
    const mem = await hindsightService.getAll(req.params.customerId);
    res.json(mem);
  } catch (err) {
    res.status(503).json({ error: "Hindsight unreachable", detail: err.message });
  }
};

exports.searchMemory = async (req, res) => {
  try {
    const { q } = req.query;
    const results = await hindsightService.search(req.params.customerId, q || "");
    res.json(results);
  } catch (err) {
    res.status(503).json({ error: "Hindsight unreachable", detail: err.message });
  }
};

exports.saveExperience = async (req, res) => {
  try {
    const record = await hindsightService.save(req.params.customerId, req.body);
    res.status(201).json(record);
  } catch (err) {
    res.status(503).json({ error: "Hindsight unreachable", detail: err.message });
  }
};
