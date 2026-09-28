const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");

router.get("/", ticketController.listTickets);
router.post("/", ticketController.createTicket);
router.post("/:id/resolve", ticketController.resolveTicket);

module.exports = router;
