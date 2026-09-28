const customerService = require("../services/customerService");

exports.listCustomers = async (req, res) => {
  const customers = await customerService.list();
  res.json(customers);
};

exports.getCustomer = async (req, res) => {
  const customer = await customerService.getById(req.params.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
};
