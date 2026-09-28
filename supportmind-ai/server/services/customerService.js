// TODO(production): back this with MongoDB (a `customers` collection).
const customers = [
  {
    id: "c1",
    name: "Ananya Sharma",
    since: "January 2026",
    environment: { os: "Windows 11", browser: "Chrome", app: "v4.2", device: "Laptop" },
    preferences: { communication: "Email", responseStyle: "Short instructions" },
  },
  {
    id: "c2",
    name: "Rahul Kumar",
    since: "March 2025",
    environment: { os: "macOS 15", browser: "Safari", app: "v4.2", device: "MacBook" },
    preferences: { communication: "Chat", responseStyle: "Detailed explanation" },
  },
];

exports.list = async () => customers;
exports.getById = async (id) => customers.find((c) => c.id === id) || null;
