/* =========================================================
   SupportMind AI — App Router & Page Renderers
   ========================================================= */

const app = document.getElementById("main");
let state = { page: "dashboard", params: {} };

function nav(page, params = {}) {
  state = { page, params };
  document.querySelectorAll(".nav-item").forEach((el) =>
    el.classList.toggle("active", el.dataset.page === page)
  );
  render();
  app.scrollTop = 0;
}

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

function render() {
  switch (state.page) {
    case "dashboard": return renderDashboard();
    case "customers": return renderCustomers();
    case "customer-profile": return renderCustomerProfile(state.params.id);
    case "tickets": return renderTickets();
    case "create-ticket": return renderCreateTicket();
    case "ai-support": return renderAISupport(state.params.ticketId);
    case "conversation": return renderConversation(state.params.ticketId);
    case "memory": return renderMemoryHub();
    case "customer-memory": return renderCustomerMemory(state.params.id);
    case "memory-search": return renderMemorySearch();
    case "knowledge": return renderKnowledge();
    case "analytics": return renderAnalytics();
    case "settings": return renderSettings();
    default: return renderDashboard();
  }
}

/* ---------------- DASHBOARD ---------------- */
function renderDashboard() {
  const s = DB.stats();
  const recent = DB.data.tickets.slice(0, 5);
  app.innerHTML = `
    <div class="page-header">
      <h1>Customer Support Intelligence</h1>
      <p>Support that remembers your customers.</p>
    </div>
    <div class="grid grid-4">
      <div class="card stat-card"><div class="num">${s.total}</div><div class="label">Tickets</div></div>
      <div class="card stat-card"><div class="num">${s.resolved}</div><div class="label">Resolved</div></div>
      <div class="card stat-card"><div class="num">${s.open}</div><div class="label">Open</div></div>
      <div class="card stat-card"><div class="num">${s.returning}</div><div class="label">Returning</div></div>
    </div>

    <div class="section-title">Recent Tickets</div>
    <div class="card">
      <table>
        <thead><tr><th>ID</th><th>Issue</th><th>Priority</th><th>Status</th></tr></thead>
        <tbody>
          ${recent.map(t => `
            <tr class="clickable" onclick="nav('ai-support',{ticketId:${t.id}})">
              <td>#${t.id}</td><td>${t.issue}</td>
              <td><span class="badge ${t.priority.toLowerCase()}">${t.priority}</span></td>
              <td><span class="badge ${t.status.toLowerCase()}">${t.status}</span></td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <div class="section-title">AI Memory Insight</div>
    <div class="card" style="border-color: var(--brand);">
      🧠 <b>${s.returning} returning customers</b> have previous support history Hindsight can recall.
      <div style="margin-top:14px;"><button class="btn" onclick="nav('create-ticket')">Start AI Support</button></div>
    </div>
  `;
}

/* ---------------- CUSTOMERS ---------------- */
function renderCustomers() {
  const q = state.params.q || "";
  const list = DB.data.customers.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
  app.innerHTML = `
    <div class="page-header"><h1>Customers</h1><p>Everyone Hindsight has a memory for.</p></div>
    <div class="searchbar">
      <input id="custSearch" placeholder="Search customer..." value="${q}" oninput="nav('customers',{q:this.value})" />
    </div>
    ${list.map(c => {
      const tix = DB.ticketsFor(c.id);
      const resolved = tix.filter(t => t.status === "Resolved").length;
      const last = tix[0]?.createdAt || "—";
      return `
      <div class="customer-list-item" onclick="nav('customer-profile',{id:'${c.id}'})">
        <div>
          <div class="name">${c.name}</div>
          <div class="meta">${tix.length} tickets | ${resolved} resolved</div>
        </div>
        <div class="meta">Last contact: ${last}</div>
      </div>`;
    }).join("") || `<div class="empty">No customers found.</div>`}
  `;
  // keep focus in the search box while typing
  setTimeout(() => {
    const el = document.getElementById("custSearch");
    if (el) { el.focus(); el.selectionStart = el.selectionEnd = el.value.length; }
  }, 0);
}

/* ---------------- CUSTOMER PROFILE ---------------- */
function renderCustomerProfile(id) {
  const c = DB.customer(id);
  if (!c) return nav("customers");
  const tix = DB.ticketsFor(id);
  const resolved = tix.filter(t => t.status === "Resolved");
  const open = tix.filter(t => t.status === "Open");
  const mem = DB.memoryFor(id);
  const solutions = [...new Set(mem.map(m => m.solution))];

  app.innerHTML = `
    <div class="page-header"><h1>${c.name}</h1><p>Customer since ${c.since}</p></div>

    <div class="profile-hero">
      <div class="avatar">${c.name.split(" ").map(n => n[0]).join("")}</div>
      <div>
        <div class="tag-row">
          <span class="pill">${tix.length} tickets</span>
          <span class="pill check">${resolved.length} resolved</span>
          <span class="pill">${open.length} open</span>
        </div>
      </div>
      <div style="margin-left:auto; display:flex; gap:10px;">
        <button class="btn secondary" onclick="nav('customer-memory',{id:'${c.id}'})">🧠 View Memory</button>
        <button class="btn" onclick="startTicketFor('${c.id}')">+ New Ticket</button>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="section-title" style="margin-top:0;">Environment</div>
        <div class="kv"><b>OS</b><span>${c.environment.os}</span></div>
        <div class="kv"><b>Browser</b><span>${c.environment.browser}</span></div>
        <div class="kv"><b>Application</b><span>${c.environment.app}</span></div>
        <div class="kv"><b>Device</b><span>${c.environment.device}</span></div>
      </div>
      <div class="card">
        <div class="section-title" style="margin-top:0;">Customer Preferences</div>
        <div class="kv"><b>Communication</b><span>${c.preferences.communication}</span></div>
        <div class="kv"><b>Response style</b><span>${c.preferences.responseStyle}</span></div>
        <div class="divider"></div>
        <div class="section-title" style="margin-top:0;">Experience Signal</div>
        <div class="kv"><b>Previous</b><span>${c.sentiment.previous}</span></div>
        <div class="kv"><b>Current</b><span>${c.sentiment.current}</span></div>
        <div class="kv"><b>Trend</b><span>${c.sentiment.trend}</span></div>
        <div class="small-note">AI-generated signal from conversation tone — not a medical or psychological assessment.</div>
      </div>
    </div>

    <div class="section-title">Previous Issues</div>
    <div class="card">
      ${tix.length ? tix.map(t => `
        <div class="kv" style="grid-template-columns:1fr 140px;">
          <span>${t.status === "Resolved" ? "✓" : "•"} ${t.issue} <span style="color:var(--text-dim)">#${t.id}</span></span>
          <span><span class="badge ${t.status.toLowerCase()}">${t.status}</span></span>
        </div>
      `).join("") : `<div class="empty">No previous issues.</div>`}
    </div>

    <div class="section-title">Solutions That Worked Before</div>
    <div class="card">
      ${solutions.length ? `<div class="pill-list">${solutions.map(s => `<span class="pill check">✓ ${s}</span>`).join("")}</div>` : `<div class="empty">No stored solutions yet.</div>`}
    </div>
  `;
}

function startTicketFor(customerId) {
  nav("create-ticket", { customerId });
}

/* ---------------- TICKETS ---------------- */
function renderTickets() {
  const filter = state.params.filter || "All";
  let list = DB.data.tickets;
  if (filter !== "All") list = list.filter(t => t.status === filter);
  app.innerHTML = `
    <div class="page-header"><h1>Tickets</h1><p>All support tickets across every customer.</p></div>
    <div class="searchbar">
      <select onchange="nav('tickets',{filter:this.value})" style="max-width:200px;">
        ${["All","Open","Resolved"].map(f => `<option ${filter===f?"selected":""}>${f}</option>`).join("")}
      </select>
      <button class="btn" style="margin-left:auto;" onclick="nav('create-ticket')">+ Create Ticket</button>
    </div>
    <div class="card">
      <table>
        <thead><tr><th>Ticket</th><th>Customer</th><th>Issue</th><th>Priority</th><th>Status</th></tr></thead>
        <tbody>
          ${list.map(t => {
            const c = DB.customer(t.customerId);
            return `<tr class="clickable" onclick="nav('ai-support',{ticketId:${t.id}})">
              <td>#${t.id}</td><td>${c ? c.name : "—"}</td><td>${t.issue}</td>
              <td><span class="badge ${t.priority.toLowerCase()}">${t.priority}</span></td>
              <td><span class="badge ${t.status.toLowerCase()}">${t.status}</span></td>
            </tr>`;
          }).join("") || `<tr><td colspan="5" class="empty">No tickets.</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

/* ---------------- CREATE TICKET ---------------- */
function renderCreateTicket() {
  const preselect = state.params.customerId || DB.data.customers[0].id;
  app.innerHTML = `
    <div class="page-header"><h1>Create Support Ticket</h1><p>Kick off a new issue and let the AI investigate.</p></div>
    <div class="card" style="max-width:640px;">
      <div class="field">
        <label>Customer</label>
        <select id="ct-customer">
          ${DB.data.customers.map(c => `<option value="${c.id}" ${c.id===preselect?"selected":""}>${c.name}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Problem</label>
        <input id="ct-problem" placeholder="e.g. Application crashes when uploading PDF" value="Application crashes when uploading PDF" />
      </div>
      <div class="field">
        <label>Description</label>
        <textarea id="ct-desc" rows="3" placeholder="Describe the issue...">The application closes whenever I upload a PDF file.</textarea>
      </div>
      <div class="grid grid-2">
        <div class="field">
          <label>Priority</label>
          <select id="ct-priority">
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
        </div>
        <div class="field">
          <label>Environment</label>
          <input id="ct-env" placeholder="Chrome / Windows 11" />
        </div>
      </div>
      <button class="btn" onclick="submitTicket()">Start AI Investigation →</button>
    </div>
  `;
  // autofill environment from selected customer
  const custSel = document.getElementById("ct-customer");
  const envInput = document.getElementById("ct-env");
  function fillEnv() {
    const c = DB.customer(custSel.value);
    envInput.value = `${c.environment.browser} / ${c.environment.os}`;
  }
  custSel.addEventListener("change", fillEnv);
  fillEnv();
}

function submitTicket() {
  const customerId = document.getElementById("ct-customer").value;
  const issue = document.getElementById("ct-problem").value.trim() || "General Issue";
  const description = document.getElementById("ct-desc").value.trim();
  const priority = document.getElementById("ct-priority").value;
  const environment = document.getElementById("ct-env").value;
  const t = DB.addTicket({ customerId, issue, description, priority, environment });
  nav("ai-support", { ticketId: t.id });
}

/* ---------------- AI SUPPORT (the core demo) ---------------- */
function renderAISupport(ticketId) {
  if (ticketId === undefined) {
    // Sidebar click with no specific ticket selected — jump to the most relevant open ticket.
    const openTicket = DB.data.tickets.find(t => t.status === "Open") || DB.data.tickets[0];
    if (openTicket) return nav("ai-support", { ticketId: openTicket.id });
    return nav("create-ticket");
  }
  const t = DB.ticket(ticketId);
  if (!t) return nav("tickets");
  const c = DB.customer(t.customerId);

  app.innerHTML = `
    <div class="page-header"><h1>AI Support Agent</h1><p>Ticket #${t.id} — ${c.name}</p></div>

    <div class="grid grid-2">
      <div class="card">
        <div class="section-title" style="margin-top:0;">Customer</div>
        <div style="font-weight:600; font-size:16px;">${c.name}</div>
        <div class="small-note">${c.environment.browser} / ${c.environment.os} · ${c.environment.app}</div>
      </div>
      <div class="card">
        <div class="section-title" style="margin-top:0;">Current Issue</div>
        <div style="font-weight:600; font-size:16px;">${t.issue}</div>
        <div class="small-note">${t.description || ""}</div>
      </div>
    </div>

    <div class="section-title">Investigation</div>
    <div class="card" id="ai-steps"></div>

    <div id="ai-memory-block"></div>
    <div id="ai-recommend-block"></div>
    <div id="ai-actions" style="margin-top:20px; display:none;">
      <button class="btn" onclick="nav('conversation',{ticketId:${t.id}})">💬 Open Conversation</button>
      <button class="btn secondary" onclick="nav('customer-memory',{id:'${c.id}'})">🧠 View Full Memory</button>
    </div>
  `;

  runAIInvestigation(t, c);
}

function stepHTML(icon, cls, title, sub) {
  return `<div class="step">
    <div class="icon ${cls}">${icon}</div>
    <div class="content"><div class="title">${title}</div><div class="sub">${sub}</div></div>
  </div>`;
}

async function runAIInvestigation(t, c) {
  const stepsEl = document.getElementById("ai-steps");
  const memBlock = document.getElementById("ai-memory-block");
  const recBlock = document.getElementById("ai-recommend-block");
  const actions = document.getElementById("ai-actions");

  // Step 1: Understand current issue
  stepsEl.innerHTML = stepHTML("⏳", "working", "Understanding current issue", "Reading ticket details and environment...");
  await sleep(600);
  stepsEl.innerHTML = stepHTML("✓", "done", "Understanding current issue",
    `${t.issue} · ${t.environment || (c.environment.browser + " / " + c.environment.os)}`);

  // Step 2: Search Hindsight (real backend if connected, else local demo memory)
  stepsEl.innerHTML += stepHTML("⏳", "working", "Searching Hindsight memory", "Looking up this customer's history...");
  await sleep(900);

  const backendResult = await tryBackendInvestigate(t, c);
  const usingRealHindsight = !!backendResult && backendResult.source === "hindsight";
  const usingLiveAI = !!backendResult;
  const matches = usingLiveAI ? backendResult.memories : DB.searchMemory(c.id, t.issue);
  const allMem = DB.memoryFor(c.id); // local count always shown for continuity in the UI
  document.querySelectorAll("#ai-steps .step")[1].outerHTML = stepHTML("✓", "done",
    "Searching Hindsight memory" + (usingRealHindsight ? " (live)" : ""),
    `${allMem.length} previous ticket${allMem.length===1?"":"s"} found · ${matches.length} similar issue${matches.length===1?"":"s"} found`);

  // Step 3: Show memory found
  if (matches.length > 0) {
    const best = matches[0];
    memBlock.innerHTML = `
      <div class="section-title">Relevant Customer Memory</div>
      <div class="memory-card">
        <div class="tag">🧠 Hindsight Recall</div>
        <div class="kv"><b>Previous issue</b><span>${best.issue} ${best.ticketId ? "(#"+best.ticketId+")" : ""}</span></div>
        <div class="kv"><b>Date</b><span>${best.date}</span></div>
        <div class="kv"><b>Environment</b><span>${best.environment}</span></div>
        <div class="kv"><b>Previous solution</b><span>${best.solution}</span></div>
        <div class="kv"><b>Outcome</b><span>✓ ${best.outcome}</span></div>
      </div>
      ${matches.length > 1 ? `<div class="small-note">+ ${matches.length-1} more related memory record(s).</div>` : ""}
    `;
  } else {
    memBlock.innerHTML = `
      <div class="section-title">Relevant Customer Memory</div>
      <div class="card"><div class="empty">No similar previous issue found in Hindsight for this customer — this looks like a new type of issue.</div></div>
    `;
  }

  await sleep(500);

  // Step 4: AI recommendation
  stepsEl.innerHTML += stepHTML("⏳", "working", "Generating recommendation", "Combining issue + memory into next steps...");
  await sleep(700);
  document.querySelectorAll("#ai-steps .step")[2].outerHTML = stepHTML("✓", "done", "Generating recommendation" + (backendResult && backendResult.aiSource === "groq" ? " (Groq live)" : ""), "Recommendation ready.");

  const rec = usingLiveAI ? backendResult.recommendation : buildRecommendation(t, matches, c);
  recBlock.innerHTML = `
    <div class="section-title">AI Analysis</div>
    <div class="card">
      <p>${rec.summary}</p>
      <div class="section-title" style="margin-top:16px;">Recommended actions</div>
      <ol style="padding-left:20px; line-height:1.9;">
        ${rec.actions.map(a => `<li>${a}</li>`).join("")}
      </ol>
      <div style="margin-top:16px; display:flex; gap:10px;">
        <button class="btn" onclick="resolveFromAI(${t.id}, '${rec.actions[0].replace(/'/g,"\\'")}')">✓ Mark Resolved &amp; Save to Hindsight</button>
      </div>
    </div>
  `;

  actions.style.display = "block";
}

function buildRecommendation(t, matches, c) {
  if (matches.length > 0) {
    const best = matches[0];
    return {
      summary: `This issue closely matches ${c.name.split(" ")[0]}'s previous "${best.issue}" case from ${best.date}, which was resolved using: ${best.solution}.`,
      actions: [
        `Confirm the customer is still on ${best.environment}`,
        `Apply the previous fix: ${best.solution}`,
        `Retry the action that triggered "${t.issue}"`,
        `If unresolved, escalate and inspect application logs`,
      ],
    };
  }
  return {
    summary: `No matching history found for "${t.issue}". Treating this as a new issue class for ${c.name.split(" ")[0]}.`,
    actions: [
      `Reproduce the issue on ${t.environment || "the reported environment"}`,
      `Check application logs for related errors`,
      `Try standard fixes: clear cache, update browser/app`,
      `Document the resolution so Hindsight can recall it next time`,
    ],
  };
}

function resolveFromAI(ticketId, solutionText) {
  const t = DB.resolveTicket(ticketId, solutionText);
  const record = {
    id: "m" + Date.now(),
    date: t.resolvedAt,
    issue: t.issue,
    environment: t.environment || "—",
    solution: solutionText,
    outcome: "Resolved",
    ticketId: t.id,
  };
  DB.addMemory(t.customerId, record); // local store: always updated, drives the UI
  mirrorSaveToBackend(t.customerId, record); // best-effort: also retain into real Hindsight if connected
  toast(hindsightConnected ? "✓ Experience saved to live Hindsight" : "✓ Experience saved (local demo memory)");
  nav("ai-support", { ticketId }); // re-render resolved state
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ---------------- CONVERSATION ---------------- */
function renderConversation(ticketId) {
  const t = DB.ticket(ticketId);
  if (!t) return nav("tickets");
  const c = DB.customer(t.customerId);
  if (!DB.data.conversations[ticketId]) {
    seedConversation(t, c);
  }
  const msgs = DB.data.conversations[ticketId] || [];

  app.innerHTML = `
    <div class="page-header"><h1>Conversation</h1><p>Ticket #${t.id} — ${c.name}</p></div>
    <div class="card">
      <div class="chat" id="chat-log">
        ${msgs.map(m => `
          <div class="msg ${m.from}">
            <div class="who">${m.from === "ai" ? "AI Support" : c.name}</div>
            ${m.text}
          </div>`).join("")}
      </div>
      <div style="display:flex; gap:10px;">
        <input id="chat-input" placeholder="Type a customer message..." onkeydown="if(event.key==='Enter') sendChat(${t.id})" />
        <button class="btn" onclick="sendChat(${t.id})">Send</button>
      </div>
    </div>
    <div style="margin-top:16px;">
      <button class="btn secondary" onclick="nav('ai-support',{ticketId:${t.id}})">← Back to AI Support</button>
      ${t.status !== "Resolved" ? `<button class="btn" onclick="resolveFromChat(${t.id})">✓ Resolve Ticket</button>` : ""}
    </div>
  `;
}

function seedConversation(t, c) {
  const matches = DB.searchMemory(c.id, t.issue).filter(m => m.ticketId !== t.id);
  const msgs = [];
  msgs.push({ from: "customer", text: t.description || `My issue: ${t.issue}` });
  if (matches.length > 0) {
    const best = matches[0];
    msgs.push({
      from: "ai",
      text: `Welcome back, ${c.name.split(" ")[0]}. I found a previous "${best.issue}" issue in your support history from ${best.date}. You were using ${best.environment}, and this was resolved with: <b>${best.solution}</b>. Are you still using the same setup?`,
    });
    msgs.push({ from: "customer", text: "Yes, same setup." });
    msgs.push({ from: "ai", text: `Thanks. Let's start with: ${best.solution}. I'll walk you through it now.` });
  } else {
    msgs.push({
      from: "ai",
      text: `Thanks for reaching out. I don't see a matching issue in your history yet, so let's investigate fresh — can you confirm your current browser and OS?`,
    });
  }
  DB.data.conversations[t.id] = msgs;
  DB.save();
}

function sendChat(ticketId) {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;
  DB.addConversation(ticketId, { from: "customer", text });
  input.value = "";
  render();
  setTimeout(() => {
    DB.addConversation(ticketId, { from: "ai", text: "Got it — noted. Let me know if that resolves it, or I can escalate this further." });
    render();
  }, 500);
}

function resolveFromChat(ticketId) {
  const t = DB.ticket(ticketId);
  const c = DB.customer(t.customerId);
  nav("ai-support", { ticketId }); // reuse the resolve flow already shown there
  toast("Head to the recommendation card to save this resolution to Hindsight.");
}

/* ---------------- MEMORY HUB ---------------- */
function renderMemoryHub() {
  app.innerHTML = `
    <div class="page-header"><h1>Customer Memory</h1><p>Hindsight: what the AI remembers about each customer.</p></div>
    <div class="grid grid-3">
      ${DB.data.customers.map(c => {
        const mem = DB.memoryFor(c.id);
        return `
        <div class="card clickable" style="cursor:pointer;" onclick="nav('customer-memory',{id:'${c.id}'})">
          <div style="font-weight:700; font-size:16px;">${c.name}</div>
          <div class="small-note">${mem.length} stored memories</div>
          <div class="tag-row" style="margin-top:10px;">
            ${[...new Set(mem.map(m=>m.issue))].slice(0,3).map(i => `<span class="pill">${i}</span>`).join("") || `<span class="empty">No memory yet</span>`}
          </div>
        </div>`;
      }).join("")}
    </div>
    <div class="section-title">Search All Memory</div>
    <div class="card">
      <button class="btn secondary" onclick="nav('memory-search')">🔎 Open Memory Search</button>
    </div>
  `;
}

function renderCustomerMemory(id) {
  const c = DB.customer(id);
  if (!c) return nav("memory");
  const mem = [...DB.memoryFor(id)].sort((a,b) => a.date.localeCompare(b.date));
  const known = new Set(mem.map(m => m.issue));
  const solutions = new Set(mem.map(m => m.solution));

  app.innerHTML = `
    <div class="page-header"><h1>${c.name} — Memory</h1><p>Long-term memory Hindsight has built for this customer.</p></div>
    <div class="grid grid-4">
      <div class="card stat-card"><div class="num">${DB.ticketsFor(id).length}</div><div class="label">Past Tickets</div></div>
      <div class="card stat-card"><div class="num">${known.size}</div><div class="label">Known Issues</div></div>
      <div class="card stat-card"><div class="num">${solutions.size}</div><div class="label">Successful Solutions</div></div>
      <div class="card stat-card"><div class="num">${Object.keys(c.preferences).length}</div><div class="label">Preferences</div></div>
    </div>

    <div class="section-title">Memory Timeline</div>
    <div class="card">
      ${mem.length ? mem.map(m => `
        <div class="timeline-item">
          <div class="timeline-date">${m.date}</div>
          <div>
            <b>${m.issue}</b><br/>
            <span class="small-note">→ ${m.solution} · ${m.outcome}</span>
          </div>
        </div>
      `).join("") : `<div class="empty">This customer has no stored memory yet. Resolve a ticket to create some.</div>`}
    </div>

    <div style="margin-top:16px;">
      <button class="btn secondary" onclick="nav('customer-profile',{id:'${c.id}'})">← Back to Profile</button>
    </div>
  `;
}

/* ---------------- MEMORY SEARCH ---------------- */
function renderMemorySearch() {
  const q = state.params.q || "";
  const results = q ? DB.searchAllMemory(q) : [];
  app.innerHTML = `
    <div class="page-header"><h1>Search Customer Memory</h1><p>Query Hindsight across every customer.</p></div>
    <div class="searchbar">
      <input id="memSearch" placeholder="e.g. PDF upload problem" value="${q}" onkeydown="if(event.key==='Enter') nav('memory-search',{q:this.value})" />
      <button class="btn" onclick="nav('memory-search',{q:document.getElementById('memSearch').value})">Search</button>
    </div>
    ${q ? `
      <div class="section-title">Relevant Memories</div>
      <div class="card">
        ${results.length ? results.map(r => `
          <div class="kv" style="grid-template-columns: 1fr 2fr;">
            <span><b>${r.customer}</b><br/><span class="small-note">${r.date}</span></span>
            <span>${r.issue} ${r.ticketId ? `(#${r.ticketId})` : ""}<br/><span class="small-note">Solution: ${r.solution}</span></span>
          </div>
          <div class="divider"></div>
        `).join("") : `<div class="empty">No memories matched "${q}".</div>`}
      </div>
    ` : `<div class="empty">Type a query above to search Hindsight's memory across all customers.</div>`}
  `;
  setTimeout(() => { const el = document.getElementById("memSearch"); if (el) el.focus(); }, 0);
}

/* ---------------- KNOWLEDGE BASE ---------------- */
function renderKnowledge() {
  const kb = DB.knowledgeBase();
  app.innerHTML = `
    <div class="page-header"><h1>Support Knowledge</h1><p>Known solutions, generated automatically from stored experiences.</p></div>
    <div class="grid grid-2">
      ${kb.map(k => `
        <div class="card">
          <div style="font-weight:700; font-size:16px; margin-bottom:8px;">${k.issue}</div>
          <div class="small-note">Common environment: ${k.envs.join(", ")}</div>
          <div class="section-title" style="margin-top:14px;">Known solutions</div>
          <div class="pill-list">${k.solutions.map(s => `<span class="pill check">✓ ${s}</span>`).join("")}</div>
          <div class="small-note" style="margin-top:10px;">Successful resolutions: ${k.count}</div>
        </div>
      `).join("") || `<div class="empty">No resolved experiences stored yet.</div>`}
    </div>
  `;
}

/* ---------------- ANALYTICS ---------------- */
function renderAnalytics() {
  const s = DB.stats();
  const issueCounts = {};
  DB.data.tickets.forEach(t => { issueCounts[t.issue] = (issueCounts[t.issue] || 0) + 1; });
  const maxCount = Math.max(1, ...Object.values(issueCounts));

  const totalMem = Object.values(DB.data.memory).reduce((s, arr) => s + arr.length, 0);
  const ticketsWithMemMatch = DB.data.tickets.filter(t => {
    const c = DB.customer(t.customerId);
    return c && DB.searchMemory(c.id, t.issue).some(m => m.ticketId !== t.id);
  }).length;
  const memAssistedPct = s.total ? Math.round((ticketsWithMemMatch / s.total) * 100) : 0;
  const repeatIssuePct = s.total ? Math.round((s.total - Object.keys(issueCounts).length) / s.total * 100) : 0;

  app.innerHTML = `
    <div class="page-header"><h1>Support Analytics</h1><p>Calculated live from current demo data.</p></div>
    <div class="grid grid-4">
      <div class="card stat-card"><div class="num">${s.total}</div><div class="label">Total Tickets</div></div>
      <div class="card stat-card"><div class="num">${s.resolved}</div><div class="label">Resolved</div></div>
      <div class="card stat-card"><div class="num">${s.open}</div><div class="label">Open</div></div>
      <div class="card stat-card"><div class="num">${s.returning}</div><div class="label">Returning Customers</div></div>
    </div>

    <div class="section-title">Common Issues</div>
    <div class="card">
      ${Object.entries(issueCounts).map(([issue,count]) => `
        <div class="bar-row">
          <div class="bar-label">${issue}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(count/maxCount)*100}%"></div></div>
          <div class="bar-val">${count}</div>
        </div>
      `).join("")}
    </div>

    <div class="section-title">Memory Impact</div>
    <div class="card">
      <div class="bar-row"><div class="bar-label">Memory-assisted</div><div class="bar-track"><div class="bar-fill" style="width:${memAssistedPct}%"></div></div><div class="bar-val">${memAssistedPct}%</div></div>
      <div class="bar-row"><div class="bar-label">Repeated issues</div><div class="bar-track"><div class="bar-fill" style="width:${repeatIssuePct}%"></div></div><div class="bar-val">${repeatIssuePct}%</div></div>
      <div class="small-note">Total memory records stored in Hindsight: ${totalMem}</div>
    </div>
  `;
}

/* ---------------- SETTINGS ---------------- */
function renderSettings() {
  const st = DB.data.settings;
  app.innerHTML = `
    <div class="page-header"><h1>Settings</h1><p>Configure your SupportMind AI workspace.</p></div>
    <div class="card" style="max-width:560px;">
      <div class="field"><label>Company Name</label><input id="s-company" value="${st.companyName}" /></div>
      <div class="field"><label>AI Model</label><input id="s-model" value="${st.aiModel}" /></div>
      <div class="field"><label>Memory System</label><input value="Hindsight ✓" disabled /></div>
      <div class="field"><label>Support Language</label>
        <select id="s-lang"><option ${st.language==="English"?"selected":""}>English</option><option ${st.language==="Hindi"?"selected":""}>Hindi</option></select>
      </div>
      <div class="field"><label>Response Style</label>
        <select id="s-style"><option ${st.responseStyle==="Professional"?"selected":""}>Professional</option><option ${st.responseStyle==="Friendly"?"selected":""}>Friendly</option></select>
      </div>
      <div class="field">
        <label><input type="checkbox" id="s-notif" ${st.notifications?"checked":""} style="width:auto; margin-right:8px;" />Notifications ON</label>
      </div>
      <button class="btn" onclick="saveSettings()">Save Settings</button>
      <button class="btn ghost" style="margin-left:10px;" onclick="if(confirm('Reset all demo data? This clears saved Hindsight memory you created during this demo.')){DB.reset(); nav('dashboard');}">Reset Demo Data</button>
    </div>
  `;
}

function saveSettings() {
  DB.data.settings.companyName = document.getElementById("s-company").value;
  DB.data.settings.aiModel = document.getElementById("s-model").value;
  DB.data.settings.language = document.getElementById("s-lang").value;
  DB.data.settings.responseStyle = document.getElementById("s-style").value;
  DB.data.settings.notifications = document.getElementById("s-notif").checked;
  DB.save();
  toast("Settings saved");
}

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  DB.load();
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.addEventListener("click", () => nav(el.dataset.page));
  });
  nav("dashboard");
});
