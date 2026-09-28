// In production, back this with MongoDB. Kept in-memory here for stub clarity.
let tickets = [];
let nextId = 1043;

exports.listTickets = (req, res) => res.json(tickets);

exports.createTicket = (req, res) => {
  const ticket = { id: nextId++, status: "Open", createdAt: new Date().toISOString(), ...req.body };
  tickets.unshift(ticket);
  res.status(201).json(ticket);
};

exports.resolveTicket = (req, res) => {
  const ticket = tickets.find((t) => t.id === Number(req.params.id));
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });
  ticket.status = "Resolved";
  ticket.solution = req.body.solution || null;
  ticket.resolvedAt = new Date().toISOString();
  res.json(ticket);
};
