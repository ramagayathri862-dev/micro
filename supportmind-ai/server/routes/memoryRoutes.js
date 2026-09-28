const express = require("express");
const router = express.Router();
const memoryController = require("../controllers/memoryController");

router.get("/:customerId", memoryController.getMemory);
router.get("/:customerId/search", memoryController.searchMemory);
router.post("/:customerId", memoryController.saveExperience);

module.exports = router;
