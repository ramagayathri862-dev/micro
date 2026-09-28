/* =========================================================
   SupportMind AI — Demo Data + Hindsight Memory Store
   Everything here is mock/demo data for the hackathon build.
   The "Hindsight" memory is simulated with localStorage so
   the AI genuinely recalls things you save during the demo.
   ========================================================= */

const STORAGE_KEY = "supportmind_ai_db_v1";

function defaultDB() {
  return {
    settings: {
      companyName: "TechNova",
      aiModel: "Groq (Llama 3)",
      memorySystem: "Hindsight",
      language: "English",
      responseStyle: "Professional",
      notifications: true,
    },
    customers: [
      {
        id: "c1",
        name: "Ananya Sharma",
        since: "January 2026",
        environment: {
          os: "Windows 11",
          browser: "Chrome",
          app: "v4.2",
          device: "Laptop",
        },
        preferences: {
          communication: "Email",
          responseStyle: "Short instructions",
        },
        sentiment: {
          previous: "High",
          current: "Moderate",
          trend: "Improving",
        },
      },
      {
        id: "c2",
        name: "Rahul Kumar",
        since: "March 2025",
        environment: {
          os: "macOS 15",
          browser: "Safari",
          app: "v4.2",
          device: "MacBook",
        },
        preferences: {
          communication: "Chat",
          responseStyle: "Detailed explanation",
        },
        sentiment: {
          previous: "Medium",
          current: "Low",
          trend: "Stable",
        },
      },
      {
        id: "c3",
        name: "Priya Reddy",
        since: "August 2024",
        environment: {
          os: "Windows 10",
          browser: "Edge",
          app: "v4.1",
          device: "Desktop",
        },
        preferences: {
          communication: "Email",
          responseStyle: "Short instructions",
        },
        sentiment: {
          previous: "Low",
          current: "Low",
          trend: "Stable",
        },
      },
    ],

    tickets: [
      { id: 1039, customerId: "c1", issue: "PDF Upload Error", description: "Application closes whenever a PDF file is uploaded.", priority: "High", status: "Resolved", environment: "Chrome / Windows 11", createdAt: "2026-02-02", resolvedAt: "2026-02-02" },
      { id: 1038, customerId: "c1", issue: "Login Timeout", description: "Session expires immediately after login.", priority: "Medium", status: "Resolved", environment: "Chrome / Windows 11", createdAt: "2026-01-10", resolvedAt: "2026-01-10" },
      { id: 1037, customerId: "c1", issue: "Application Crash", description: "App crashes on startup after update.", priority: "High", status: "Resolved", environment: "Chrome / Windows 11", createdAt: "2026-02-20", resolvedAt: "2026-02-20" },
      { id: 1036, customerId: "c1", issue: "Payment Failure", description: "Card payment declined at checkout.", priority: "High", status: "Resolved", environment: "Chrome / Windows 11", createdAt: "2026-03-01", resolvedAt: "2026-03-01" },
      { id: 1041, customerId: "c2", issue: "Login Failure", description: "Unable to log in with correct credentials.", priority: "Medium", status: "Open", environment: "Safari / macOS 15", createdAt: "2026-09-20" },
      { id: 1040, customerId: "c3", issue: "Payment Issue", description: "Subscription payment not going through.", priority: "High", status: "Resolved", environment: "Edge / Windows 10", createdAt: "2026-09-18", resolvedAt: "2026-09-19" },
      { id: 1042, customerId: "c1", issue: "PDF Upload Error", description: "The application closes whenever I upload a PDF file.", priority: "High", status: "Open", environment: "Chrome / Windows 11", createdAt: "2026-09-27" },
    ],

    /* Hindsight memory: keyed by customerId -> array of memory records.
       Each record represents a resolved experience the agent can recall. */
    memory: {
      c1: [
        { id: "m1", date: "2026-01-10", issue: "Login problem", environment: "Chrome / Windows 11", solution: "Session reset", outcome: "Resolved", ticketId: 1038 },
        { id: "m2", date: "2026-02-02", issue: "PDF upload problem", environment: "Chrome / Windows 11", solution: "Clear browser cache + update Chrome", outcome: "Resolved", ticketId: 1039 },
        { id: "m3", date: "2026-02-20", issue: "Application crash", environment: "Chrome / Windows 11", solution: "Chrome update", outcome: "Resolved", ticketId: 1037 },
        { id: "m4", date: "2026-03-01", issue: "Payment failure", environment: "Chrome / Windows 11", solution: "Retry with alternate card", outcome: "Resolved", ticketId: 1036 },
      ],
      c2: [
        { id: "m5", date: "2026-06-14", issue: "Slow application load", environment: "Safari / macOS 15", solution: "Cleared local storage", outcome: "Resolved", ticketId: null },
      ],
      c3: [
        { id: "m6", date: "2026-09-19", issue: "Payment issue", environment: "Edge / Windows 10", solution: "Refreshed payment token", outcome: "Resolved", ticketId: 1040 },
      ],
    },

    conversations: {}, // ticketId -> array of {from, text}
    nextTicketId: 1043,
  };
}

const DB = {
  data: null,
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this.data = JSON.parse(raw);
        return this.data;
      } catch (e) {
        console.warn("Corrupt storage, resetting", e);
      }
    }
    this.data = defaultDB();
    this.save();
    return this.data;
  },
  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  },
  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.load();
  },
  customer(id) {
    return this.data.customers.find((c) => c.id === id);
  },
  ticketsFor(customerId) {
    return this.data.tickets.filter((t) => t.customerId === customerId);
  },
  ticket(id) {
    return this.data.tickets.find((t) => t.id === Number(id));
  },
  memoryFor(customerId) {
    return this.data.memory[customerId] || [];
  },
  addMemory(customerId, record) {
    if (!this.data.memory[customerId]) this.data.memory[customerId] = [];
    this.data.memory[customerId].push(record);
    this.save();
  },
  addTicket(ticket) {
    ticket.id = this.data.nextTicketId++;
    ticket.status = "Open";
    ticket.createdAt = new Date().toISOString().slice(0, 10);
    this.data.tickets.unshift(ticket);
    this.save();
    return ticket;
  },
  resolveTicket(id, solutionText) {
    const t = this.ticket(id);
    if (t) {
      t.status = "Resolved";
      t.resolvedAt = new Date().toISOString().slice(0, 10);
      t.solution = solutionText;
      this.save();
    }
    return t;
  },
  addConversation(ticketId, msg) {
    if (!this.data.conversations[ticketId]) this.data.conversations[ticketId] = [];
    this.data.conversations[ticketId].push(msg);
    this.save();
  },
  stats() {
    const total = this.data.tickets.length;
    const resolved = this.data.tickets.filter((t) => t.status === "Resolved").length;
    const open = total - resolved;
    const returning = this.data.customers.filter(
      (c) => (this.data.memory[c.id] || []).length > 1
    ).length;
    return { total, resolved, open, returning };
  },
  /* very small "keyword recall" simulating a semantic search over memory */
  searchMemory(customerId, query) {
    const mem = this.memoryFor(customerId);
    const q = query.toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    return mem
      .map((m) => {
        const hay = (m.issue + " " + m.environment + " " + m.solution).toLowerCase();
        const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
        return { ...m, score };
      })
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score);
  },
  searchAllMemory(query) {
    const q = query.toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    const results = [];
    for (const cust of this.data.customers) {
      const mem = this.memoryFor(cust.id);
      mem.forEach((m) => {
        const hay = (cust.name + " " + m.issue + " " + m.environment + " " + m.solution).toLowerCase();
        const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
        if (score > 0) results.push({ ...m, customer: cust.name, customerId: cust.id, score });
      });
    }
    return results.sort((a, b) => b.score - a.score);
  },
  knowledgeBase() {
    // Aggregate memory across all customers into "known issue" clusters
    const clusters = {};
    for (const cid in this.data.memory) {
      this.data.memory[cid].forEach((m) => {
        const key = m.issue.toLowerCase().replace(/[^a-z]/g, "");
        if (!clusters[key]) {
          clusters[key] = { issue: m.issue, envs: new Set(), solutions: new Set(), count: 0 };
        }
        clusters[key].envs.add(m.environment);
        clusters[key].solutions.add(m.solution);
        clusters[key].count++;
      });
    }
    return Object.values(clusters).map((c) => ({
      issue: c.issue,
      envs: Array.from(c.envs),
      solutions: Array.from(c.solutions),
      count: c.count,
    }));
  },
};
