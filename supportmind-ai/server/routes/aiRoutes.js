const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

// Runs the full investigate flow: understand issue -> search Hindsight -> recommend
router.post("/investigate/:ticketId", aiController.investigate);

module.exports = router;
