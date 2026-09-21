/**
 * CivicResolve AI — Core Dashboard Application Logic
 * Integrates GIS Map, Chart.js, Verification Studio, and API Client.
 */

let mapInstance = null;
let mapMarkers = [];
let chartDepartmentsInstance = null;
let chartCategoriesInstance = null;
let currentInspectingComplaintId = null;
let currentDispatchingComplaintId = null;

// Current filters state
let activeFilters = {
  search: "",
  status: "ALL",
  department: "ALL",
  severity: "ALL",
  sortBy: "date",
  mapLayer: "ALL"
};

function safeCreateIcons() {
  if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
    try { lucide.createIcons(); } catch (e) { console.warn("Lucide notice:", e); }
  }
}

// --- Lifecycle Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  try { initMap(); } catch(e) { console.error("Map init error:", e); }
  try { initCharts(); } catch(e) { console.error("Charts init error:", e); }
  try { renderAll(); } catch(e) { console.error("Render error:", e); }
  try { updateApiModeIndicator(); } catch(e) {}

  // Subscribe to store changes for reactive UI updates
  if (window.store && typeof window.store.subscribe === 'function') {
    window.store.subscribe(() => {
      try { renderAll(); } catch (e) { console.error("Store update render error:", e); }
    });
  }
});

// --- Tab Navigation ---
function switchTab(tabId) {
  const tabs = ["command", "complaints", "verification", "analytics", "workers"];
  tabs.forEach(t => {
    const el = document.getElementById(`tab-content-${t}`);
    const btn = document.getElementById(`nav-tab-${t}`);
    if (el) el.classList.toggle("hidden", t !== tabId);
    if (btn) {
      if (t === tabId) {
        btn.className = "px-3.5 py-1.5 rounded-lg text-white bg-cyan-500/20 border border-cyan-500/30 flex items-center gap-1.5 transition-all";
      } else {
        btn.className = "px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-all";
      }
    }
  });

  if (tabId === "command" && mapInstance) {
    setTimeout(() => { mapInstance.invalidateSize(); }, 200);
  }
  if (tabId === "analytics") {
    updateCharts();
  }

  safeCreateIcons();
}

// --- Map Initialization ---
function initMap() {
  const mapEl = document.getElementById("gis-map");
  if (!mapEl) return;

  if (typeof L === 'undefined') {
    mapEl.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 bg-slate-950/80">
        <div class="text-cyan-400 font-semibold text-sm mb-1.5">GIS Spatial Grid Ready</div>
        <p class="text-xs text-slate-400 max-w-sm">Leaflet map library will render once online. In the meantime, complaints table, AI verification, and inspector are active.</p>
      </div>
    `;
    return;
  }

  mapInstance = L.map('gis-map', {
    zoomControl: true,
    attributionControl: false
  }).setView(CONFIG.DEFAULT_CENTER_COORDS, CONFIG.DEFAULT_ZOOM);

  // Free/public OpenStreetMap tiles (no API key required)
  const tileUrl = CONFIG.MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttr = CONFIG.MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  L.tileLayer(tileUrl, {
    maxZoom: 19,
    subdomains: 'abc',
    attribution: tileAttr
  }).addTo(mapInstance);

  renderMapMarkers();
}


function renderMapMarkers() {
  if (!mapInstance) return;

  // Clear existing markers
  mapMarkers.forEach(m => mapInstance.removeLayer(m));
  mapMarkers = [];

  const complaints = window.store.getComplaints();

  complaints.forEach(c => {
    if (!c.latitude || !c.longitude) return;

    // Check layer filter
    if (activeFilters.mapLayer !== "ALL") {
      if (activeFilters.mapLayer === "CRITICAL" && c.severity !== "CRITICAL") return;
      if (activeFilters.mapLayer !== "CRITICAL" && c.department !== activeFilters.mapLayer) return;
    }

    const priorityInfo = CONFIG.PRIORITIES[c.severity] || CONFIG.PRIORITIES.MEDIUM;
    const isCriticalOrBreached = c.severity === "CRITICAL" || c.status === "SLA_BREACH" || c.status === "ESCALATED";

    const customIcon = L.divIcon({
      className: isCriticalOrBreached ? 'pulse-marker' : '',
      html: `
        <div style="background-color: ${priorityInfo.color}; width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 0 10px ${priorityInfo.color}; display: flex; items-center; justify-content: center;">
        </div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    const marker = L.marker([c.latitude, c.longitude], { icon: customIcon }).addTo(mapInstance);

    const popupHtml = `
      <div class="text-xs p-1" style="min-width: 200px;">
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <span class="font-bold text-white">${c.complaint_id}</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase" style="color: ${priorityInfo.color}; background: ${priorityInfo.color}20;">${c.severity}</span>
        </div>
        <div class="font-semibold text-slate-200 mb-1">${c.issue_type}</div>
        <p class="text-[11px] text-slate-400 mb-2 line-clamp-2">${c.description}</p>
        <div class="flex items-center justify-between pt-1.5 border-t border-white/10">
          <span class="text-[10px] text-slate-400">${c.status}</span>
          <button onclick="openInspectModal('${c.complaint_id}')" class="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-[11px]">Inspect</button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    mapMarkers.push(marker);
  });
}

function filterMapLayer(layer) {
  activeFilters.mapLayer = layer;
  renderMapMarkers();

  document.querySelectorAll(".map-filter-btn").forEach(btn => {
    btn.classList.remove("ring-2", "ring-cyan-400");
  });
  if (event && event.target) {
    event.target.classList.add("ring-2", "ring-cyan-400");
  }
}

// --- Render Master Function ---
function renderAll() {
  renderKpis();
  renderComplaintsTable();
  renderAgentTimeline();
  renderVerificationStudio();
  renderWorkersGrid();
  renderMapMarkers();
  updateCharts();
  safeCreateIcons();
}

// --- Render KPI Cards ---
function renderKpis() {
  const stats = window.store.getAnalytics();
  document.getElementById("kpi-total").innerText = stats.total;
  document.getElementById("kpi-pending").innerText = stats.pending;
  document.getElementById("kpi-inprogress").innerText = stats.inProgress;
  document.getElementById("kpi-resolved").innerText = stats.resolved;
  document.getElementById("kpi-breached").innerText = stats.breached;
  document.getElementById("kpi-verification").innerText = stats.reopened + (window.store.getComplaints({ status: "VERIFICATION" }).length);

  document.getElementById("tab-count-complaints").innerText = stats.total;
  document.getElementById("stat-avg-hours").innerText = `${stats.avgResolutionHours} hrs`;
  document.getElementById("stat-sla-rate").innerText = `${stats.slaComplianceRate}%`;

  const pendingVerifs = window.store.getComplaints().filter(c => c.status === "VERIFICATION" || (c.resolutions && c.resolutions.some(r => r.verification_status === "PENDING"))).length;
  document.getElementById("verification-queue-count").innerText = pendingVerifs;
  document.getElementById("tab-badge-verification").style.display = pendingVerifs > 0 ? "block" : "none";
}

// --- Render Complaints Table ---
function renderComplaintsTable() {
  const tbody = document.getElementById("complaints-table-body");
  if (!tbody) return;

  const complaints = window.store.getComplaints(activeFilters);

  if (complaints.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-slate-400">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-500"></i>
          No civic complaints matching the selected filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = complaints.map(c => {
    const priority = CONFIG.PRIORITIES[c.severity] || CONFIG.PRIORITIES.MEDIUM;
    const statusMeta = CONFIG.STATUSES[c.status] || { label: c.status, class: "bg-slate-500/20 text-slate-300" };
    const deptMeta = CONFIG.DEPARTMENTS[c.department] || { name: c.department || "Unassigned" };
    const worker = c.assigned_worker_id ? window.store.workers.find(w => w.id === c.assigned_worker_id) : null;
    
    // SLA urgency calculation
    let slaBadge = "";
    if (c.status !== "CLOSED" && c.status !== "RESOLVED") {
      const deadline = new Date(c.sla_deadline);
      const isBreached = deadline < new Date() || c.status === "SLA_BREACH";
      if (isBreached) {
        slaBadge = `<span class="text-[10px] text-rose-400 font-bold block animate-pulse">⚠️ SLA BREACHED</span>`;
      } else {
        const diffHrs = Math.max(0, Math.round((deadline - new Date()) / (3600 * 1000)));
        slaBadge = `<span class="text-[10px] text-amber-400 block">${diffHrs}h remaining</span>`;
      }
    }

    return `
      <tr class="hover:bg-white/5 transition-all">
        <td class="py-3 px-4">
          <span class="font-mono font-bold text-cyan-400">${c.complaint_id}</span>
          <span class="text-[10px] text-slate-400 block">${new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </td>
        <td class="py-3 px-4 max-w-xs">
          <div class="font-semibold text-white flex items-center gap-1.5">
            ${c.issue_type}
            ${c.duplicate_of ? `<span title="Duplicate of ${c.duplicate_of}" class="px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-300 rounded">DUP</span>` : ''}
          </div>
          <div class="text-xs text-slate-400 truncate" title="${c.description}">${c.description}</div>
          <div class="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
            <i data-lucide="map-pin" class="w-3 h-3 text-slate-400"></i> ${c.location_text || "Coordinates logged"}
          </div>
        </td>
        <td class="py-3 px-4">
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold border ${priority.badgeClass}">
            ${c.severity}
          </span>
          <span class="text-[10px] text-slate-400 block mt-0.5">Score: ${c.severity_score ? c.severity_score.toFixed(2) : '0.50'}</span>
        </td>
        <td class="py-3 px-4">
          <div class="text-xs font-medium text-slate-200">${deptMeta.name}</div>
          <span class="text-[10px] text-slate-400 font-mono">${c.department || 'PENDING'}</span>
        </td>
        <td class="py-3 px-4">
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.class}">
            ${statusMeta.label}
          </span>
          ${slaBadge}
        </td>
        <td class="py-3 px-4 text-xs">
          ${worker ? `
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-cyan-600/30 text-cyan-300 font-bold flex items-center justify-center text-[10px]">
                ${worker.name.charAt(0)}
              </div>
              <div>
                <div class="text-white font-medium">${worker.name}</div>
                <div class="text-[10px] text-slate-400">${worker.phone}</div>
              </div>
            </div>
          ` : `
            <button onclick="openWorkerDispatch('${c.complaint_id}')" class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-white/10 text-xs transition-all">
              + Dispatch Worker
            </button>
          `}
        </td>
        <td class="py-3 px-4 text-right">
          <button onclick="openInspectModal('${c.complaint_id}')" class="px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-medium transition-all shadow-sm">
            Inspect AI
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// --- Render Autonomous Agent Activity Timeline ---
function renderAgentTimeline() {
  const container = document.getElementById("agent-actions-list");
  if (!container) return;

  const actions = window.store.getAgentActions().slice(0, 15);

  container.innerHTML = actions.map(act => {
    let icon = "activity";
    let colorClass = "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";

    if (act.action.includes("CLASSIFY")) {
      icon = "sparkles";
      colorClass = "text-purple-400 bg-purple-500/10 border-purple-500/20";
    } else if (act.action.includes("ESCALATE") || act.action.includes("BREACH")) {
      icon = "alert-triangle";
      colorClass = "text-rose-400 bg-rose-500/10 border-rose-500/20";
    } else if (act.action.includes("VERIFY")) {
      icon = "scan-eye";
      colorClass = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
    } else if (act.action.includes("ASSIGN")) {
      icon = "user-check";
      colorClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
    }

    return `
      <div class="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-3 hover:border-white/15 transition-all text-xs">
        <div class="w-8 h-8 rounded-lg border ${colorClass} flex items-center justify-center shrink-0 mt-0.5">
          <i data-lucide="${icon}" class="w-4 h-4"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1">
            <span class="font-bold text-white font-mono">${act.complaint_id} • ${act.action}</span>
            <span class="text-[10px] text-slate-400">${new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p class="text-slate-300 mt-0.5 text-[11px]">${act.reason}</p>
          <div class="text-[10px] text-cyan-400 mt-1 font-mono bg-black/30 px-2 py-0.5 rounded inline-block">
            ↳ ${act.result}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// --- Render Resolution Verification Studio ---
function renderVerificationStudio() {
  const container = document.getElementById("verification-cards-container");
  if (!container) return;

  const complaints = window.store.getComplaints().filter(c => 
    c.status === "VERIFICATION" || 
    c.status === "RESOLVED" ||
    (c.resolutions && c.resolutions.length > 0)
  );

  if (complaints.length === 0) {
    container.innerHTML = `
      <div class="col-span-2 glass-panel p-12 text-center rounded-2xl text-slate-400">
        <i data-lucide="check-check" class="w-10 h-10 mx-auto mb-2 text-emerald-500"></i>
        No civic resolutions pending verification. All completed field tasks have been audited!
      </div>
    `;
    return;
  }

  container.innerHTML = complaints.map(c => {
    const res = (c.resolutions && c.resolutions[0]) || {
      resolution_id: `RES-${c.complaint_id}`,
      resolution_description: "Field work conducted by department crew.",
      after_image_url: c.image_url,
      verification_status: "PENDING",
      verification_confidence: 0.91,
      verification_reason: "AI computer vision analysis running on post-repair evidence."
    };

    const isPending = res.verification_status === "PENDING" || c.status === "VERIFICATION";

    return `
      <div class="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-cyan-400 text-sm">${c.complaint_id}</span>
              <span class="text-white font-semibold text-sm">${c.issue_type}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                ${res.verification_status}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5"><i data-lucide="map-pin" class="w-3 h-3 inline text-slate-400"></i> ${c.location_text}</p>
          </div>
          <div class="text-right">
            <span class="text-[11px] text-slate-400 block">Assigned Worker:</span>
            <span class="text-xs font-semibold text-white">${c.assigned_worker_id || "Field Operative"}</span>
          </div>
        </div>

        <!-- Before & After Side-by-Side Visual Comparator -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <div class="text-[11px] font-semibold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <i data-lucide="image" class="w-3 h-3"></i> Before (Citizen Evidence)
            </div>
            <div class="rounded-xl overflow-hidden aspect-video bg-black border border-rose-500/30">
              <img src="${c.image_url}" alt="Before Repair" class="w-full h-full object-cover">
            </div>
          </div>
          <div>
            <div class="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <i data-lucide="image-check" class="w-3 h-3"></i> After (Worker Evidence)
            </div>
            <div class="rounded-xl overflow-hidden aspect-video bg-black border border-emerald-500/30">
              <img src="${res.after_image_url}" alt="After Repair" class="w-full h-full object-cover">
            </div>
          </div>
        </div>

        <!-- Worker Note -->
        <div class="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-xs">
          <span class="font-semibold text-slate-300">Worker Completion Notes:</span>
          <p class="text-slate-400 mt-1 italic">${res.resolution_description}</p>
        </div>

        <!-- AI Verification Assessment -->
        <div class="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/25 text-xs">
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <i data-lucide="sparkles" class="w-4 h-4"></i> AI Verification Assessment
            </div>
            <span class="text-[11px] font-mono text-cyan-400">${Math.round((res.verification_confidence || 0.92) * 100)}% Confidence</span>
          </div>
          <p class="text-slate-300">${res.verification_reason || "Visual inspection confirms defect area repaired."}</p>
        </div>

        <!-- Actions -->
        ${isPending ? `
          <div class="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
            <button onclick="handleRejectResolution('${c.complaint_id}', '${res.resolution_id}')" class="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
              <i data-lucide="x-circle" class="w-4 h-4"></i> Reject & Reopen (Escalate)
            </button>
            <button onclick="handleApproveResolution('${c.complaint_id}', '${res.resolution_id}')" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20">
              <i data-lucide="check-circle" class="w-4 h-4"></i> Approve & Close Ticket
            </button>
          </div>
        ` : `
          <div class="text-center py-2 text-xs font-medium text-slate-400 bg-white/5 rounded-xl">
            Audit Completed • Status: <span class="text-white font-bold">${c.status}</span>
          </div>
        `}
      </div>
    `;
  }).join("");
}

// --- Verification Actions ---
function handleApproveResolution(complaintId, resolutionId) {
  window.apiClient.verifyResolution(complaintId, resolutionId, true, "Authority verified before & after evidence: repair successful.");
  showToast("Resolution Verified", `Complaint ${complaintId} has been successfully audited and CLOSED.`, "success");
}

function handleRejectResolution(complaintId, resolutionId) {
  const reason = prompt("Enter reason for rejection (this will be logged in the autonomous escalation audit):", "Defect or debris still visible in after-image; repair incomplete.");
  if (!reason) return;

  window.apiClient.verifyResolution(complaintId, resolutionId, false, reason);
  showToast("Resolution Rejected", `Complaint ${complaintId} REOPENED and marked with escalation priority.`, "warning");
}

// --- Render Field Worker Grid ---
function renderWorkersGrid() {
  const grid = document.getElementById("workers-grid");
  if (!grid) return;

  const workers = window.store.getWorkers();

  grid.innerHTML = workers.map(w => {
    const dept = CONFIG.DEPARTMENTS[w.department] || { name: w.department };
    const isAvail = w.status === "AVAILABLE";

    return `
      <div class="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between gap-3">
        <div class="flex items-start gap-3">
          <img src="${w.avatar}" alt="${w.name}" class="w-12 h-12 rounded-xl object-cover border border-white/10">
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-white text-sm truncate">${w.name}</h4>
            <div class="text-xs text-cyan-400 truncate">${dept.name}</div>
            <div class="text-[11px] text-slate-400 font-mono mt-0.5">${w.phone}</div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${isAvail ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
            <span class="${isAvail ? 'text-emerald-400' : 'text-amber-400'} font-medium">${w.status}</span>
          </div>
          <span class="text-slate-400">Active Tasks: <strong class="text-white">${w.activeTasks || 0}</strong></span>
        </div>
      </div>
    `;
  }).join("");
}

// --- Chart.js Analytics ---
function initCharts() {
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js not loaded.");
    return;
  }
  const deptCtx = document.getElementById('chart-departments');
  const catCtx = document.getElementById('chart-categories');
  if (!deptCtx || !catCtx) return;


  chartDepartmentsInstance = new Chart(deptCtx, {
    type: 'bar',
    data: {
      labels: ['Roads', 'Sanitation', 'Water', 'Electric', 'Drainage'],
      datasets: [{
        label: 'Active Issues',
        data: [3, 2, 2, 1, 2],
        backgroundColor: ['#f59e0b', '#10b981', '#0ea5e9', '#eab308', '#6366f1'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } }
      }
    }
  });

  chartCategoriesInstance = new Chart(catCtx, {
    type: 'doughnut',
    data: {
      labels: ['Pothole', 'Garbage', 'Water Leak', 'Drainage', 'Street Light', 'Dumping'],
      datasets: [{
        data: [2, 1, 1, 2, 1, 1],
        backgroundColor: ['#f97316', '#10b981', '#06b6d4', '#8b5cf6', '#eab308', '#ec4899'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#cbd5e1', font: { size: 11 }, boxWidth: 12 }
        }
      }
    }
  });
}

function updateCharts() {
  if (!chartDepartmentsInstance || !chartCategoriesInstance) return;

  const stats = window.store.getAnalytics();
  
  // Update departments chart
  const deptLabels = Object.keys(stats.departmentStats).map(d => {
    return CONFIG.DEPARTMENTS[d] ? CONFIG.DEPARTMENTS[d].name.split(' ')[0] : d;
  });
  const deptValues = Object.values(stats.departmentStats);
  chartDepartmentsInstance.data.labels = deptLabels;
  chartDepartmentsInstance.data.datasets[0].data = deptValues;
  chartDepartmentsInstance.update();

  // Update categories chart
  const catLabels = Object.keys(stats.categoryStats);
  const catValues = Object.values(stats.categoryStats);
  chartCategoriesInstance.data.labels = catLabels;
  chartCategoriesInstance.data.datasets[0].data = catValues;
  chartCategoriesInstance.update();
}

// --- Modal Controls ---
function openInspectModal(complaintId) {
  currentInspectingComplaintId = complaintId;
  const c = window.store.getComplaint(complaintId);
  if (!c) return;

  const priority = CONFIG.PRIORITIES[c.severity] || CONFIG.PRIORITIES.MEDIUM;
  
  document.getElementById("modal-inspect-id").innerText = c.complaint_id;
  document.getElementById("modal-inspect-type").innerText = `• ${c.issue_type}`;
  document.getElementById("modal-inspect-location").innerText = c.location_text || "Coordinates logged";
  document.getElementById("modal-inspect-badge-severity").innerText = c.severity;
  document.getElementById("modal-inspect-badge-severity").className = `px-3 py-1 rounded-lg text-xs font-bold uppercase border ${priority.badgeClass}`;

  document.getElementById("modal-inspect-image").src = c.image_url || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80";
  document.getElementById("modal-inspect-description").innerText = c.description;

  document.getElementById("modal-inspect-citizen").innerText = c.citizen_name || "Citizen Reporter";
  document.getElementById("modal-inspect-phone").innerText = c.citizen_phone || "+91 99000 00000";
  document.getElementById("modal-inspect-time").innerText = new Date(c.created_at).toLocaleString();
  document.getElementById("modal-inspect-deadline").innerText = c.sla_deadline ? new Date(c.sla_deadline).toLocaleString() : "None set";

  // AI Perception fields
  const score = c.severity_score || 0.65;
  document.getElementById("modal-inspect-score-val").innerText = `${score.toFixed(2)} / 1.00`;
  document.getElementById("modal-inspect-score-bar").style.width = `${Math.round(score * 100)}%`;
  document.getElementById("modal-inspect-confidence").innerText = `${Math.round((c.confidence || 0.90) * 100)}% Confidence`;
  document.getElementById("modal-inspect-reason").innerText = `"${c.reason}"`;

  // Evidence list
  const evidenceContainer = document.getElementById("modal-inspect-evidence-list");
  const evidenceItems = c.evidence || ["Visual road defect detected", "High traffic street lane impact"];
  evidenceContainer.innerHTML = evidenceItems.map(ev => `
    <li class="flex items-center gap-1.5 text-slate-300">
      <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400 shrink-0"></i>
      <span>${ev}</span>
    </li>
  `).join("");

  // Duplicate cluster warning
  const dupBox = document.getElementById("modal-inspect-duplicate-box");
  if (c.duplicate_of) {
    dupBox.classList.remove("hidden");
    document.getElementById("modal-inspect-duplicate-text").innerText = `High-similarity match to ${c.duplicate_of} (Similarity: ${(c.similarity_score * 100).toFixed(1)}%). Auto-clustered into parent task.`;
  } else {
    dupBox.classList.add("hidden");
  }

  document.getElementById("modal-complaint-inspect").classList.remove("hidden");
  safeCreateIcons();
}

function closeInspectModal() {
  document.getElementById("modal-complaint-inspect").classList.add("hidden");
}

function openWorkerDispatch(complaintId) {
  currentDispatchingComplaintId = complaintId;
  const c = window.store.getComplaint(complaintId);
  const workers = window.store.getWorkers(c ? c.department : null);

  const container = document.getElementById("dispatch-workers-list");
  container.innerHTML = workers.map(w => `
    <div onclick="dispatchWorkerConfirm('${w.id}')" class="p-3 rounded-xl bg-slate-950/70 border border-white/10 hover:border-cyan-500/50 cursor-pointer flex items-center justify-between transition-all">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs">
          ${w.name.charAt(0)}
        </div>
        <div>
          <div class="font-semibold text-white text-xs">${w.name}</div>
          <div class="text-[11px] text-slate-400">${w.status} • ${w.activeTasks} active tasks</div>
        </div>
      </div>
      <button class="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium">Assign</button>
    </div>
  `).join("");

  document.getElementById("modal-worker-dispatch").classList.remove("hidden");
  safeCreateIcons();
}

function closeWorkerDispatchModal() {
  document.getElementById("modal-worker-dispatch").classList.add("hidden");
}

function dispatchWorkerConfirm(workerId) {
  if (!currentDispatchingComplaintId) return;
  window.apiClient.assignWorker(currentDispatchingComplaintId, workerId);
  closeWorkerDispatchModal();
  showToast("Worker Dispatched", `Worker ${workerId} has been successfully assigned to ${currentDispatchingComplaintId}.`, "success");
}

function openWorkerDispatchForCurrent() {
  closeInspectModal();
  if (currentInspectingComplaintId) {
    openWorkerDispatch(currentInspectingComplaintId);
  }
}

function promptChangeStatusForCurrent() {
  if (!currentInspectingComplaintId) return;
  const newStatus = prompt("Enter new status (NEW, ASSIGNED, IN_PROGRESS, RESOLVED, VERIFICATION, CLOSED, ESCALATED):");
  if (!newStatus) return;

  window.apiClient.updateStatus(currentInspectingComplaintId, newStatus.toUpperCase());
  closeInspectModal();
  showToast("Status Updated", `Complaint ${currentInspectingComplaintId} updated to ${newStatus.toUpperCase()}`, "success");
}

// --- API Settings & Connect Further ---
function openApiSettingsModal() {
  const mode = window.apiClient.mode;
  document.getElementById("radio-mode-mock").checked = mode === "mock";
  document.getElementById("radio-mode-api").checked = mode === "api";
  document.getElementById("input-api-url").value = window.apiClient.baseUrl;
  document.getElementById("modal-api-settings").classList.remove("hidden");
}

function closeApiSettingsModal() {
  document.getElementById("modal-api-settings").classList.add("hidden");
}

async function testBackendConnection() {
  const url = document.getElementById("input-api-url").value;
  const resultDiv = document.getElementById("test-connection-result");
  resultDiv.classList.remove("hidden");
  resultDiv.className = "text-[11px] mt-1.5 text-cyan-400";
  resultDiv.innerText = "Pinging endpoint...";

  const res = await window.apiClient.testConnection(url);
  if (res.success) {
    resultDiv.className = "text-[11px] mt-1.5 text-emerald-400 font-medium";
    resultDiv.innerText = `✓ ${res.message}`;
  } else {
    resultDiv.className = "text-[11px] mt-1.5 text-rose-400 font-medium";
    resultDiv.innerText = `✗ ${res.message}`;
  }
}

function saveApiSettings() {
  const selectedMode = document.querySelector('input[name="api-mode-radio"]:checked').value;
  const customUrl = document.getElementById("input-api-url").value;
  window.apiClient.setMode(selectedMode, customUrl);
  updateApiModeIndicator();
  closeApiSettingsModal();
  showToast("Settings Saved", `Operating in ${selectedMode === "api" ? "Backend API Mode" : "Standalone Mock Mode"}.`, "success");
  renderAll();
}

function updateApiModeIndicator() {
  const isApi = window.apiClient.isApiMode();
  const ind = document.getElementById("indicator-api-mode");
  const lbl = document.getElementById("label-api-mode");

  if (ind && lbl) {
    if (isApi) {
      ind.className = "w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50 animate-pulse";
      lbl.innerText = "Live API Connected";
    } else {
      ind.className = "w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50";
      lbl.innerText = "Standalone Mode";
    }
  }
}

function handleResetSeedData() {
  if (confirm("Reset all complaints, workers, and logs to initial factory demo dataset?")) {
    window.store.resetToSeedData();
    closeApiSettingsModal();
    showToast("Data Reset", "Database restored to clean hackathon presentation state.", "info");
  }
}

// --- Quick New Complaint Modal ---
function openNewComplaintModal() {
  document.getElementById("modal-new-complaint").classList.remove("hidden");
}

function closeNewComplaintModal() {
  document.getElementById("modal-new-complaint").classList.add("hidden");
}

function handleNewComplaintSubmit(e) {
  e.preventDefault();
  const desc = document.getElementById("new-comp-desc").value;
  const cat = document.getElementById("new-comp-category").value;
  const sev = document.getElementById("new-comp-severity").value;
  const loc = document.getElementById("new-comp-location").value;

  const deptMap = {
    POTHOLE: "ROAD_DEPARTMENT",
    GARBAGE: "SANITATION_DEPARTMENT",
    WATER_LEAKAGE: "WATER_SUPPLY_SEWERAGE",
    STREET_LIGHT: "ELECTRICITY_BOARD",
    DRAINAGE: "DRAINAGE_WORKS",
    ILLEGAL_DUMPING: "SANITATION_DEPARTMENT"
  };

  const scoreMap = { CRITICAL: 0.95, HIGH: 0.82, MEDIUM: 0.60, LOW: 0.35 };

  const created = window.store.addComplaint({
    description: desc,
    issue_type: cat,
    severity: sev,
    severity_score: scoreMap[sev] || 0.60,
    department: deptMap[cat] || "ROAD_DEPARTMENT",
    location_text: loc,
    latitude: 16.7050 + (Math.random() - 0.5) * 0.02,
    longitude: 74.2433 + (Math.random() - 0.5) * 0.02
  });

  closeNewComplaintModal();
  showToast("Autonomous Agent Dispatched", `Complaint ${created.complaint_id} ingested, classified and routed to ${created.department}.`, "success");
  
  // Switch to command tab and zoom to pin
  switchTab("command");
  if (mapInstance && created.latitude) {
    mapInstance.flyTo([created.latitude, created.longitude], 15, { duration: 1.2 });
  }
}

// --- Interactive 2-Minute Hackathon Demo Runner ---
function triggerDemoWalkthrough() {
  showToast("Demo Initiated", "Step 1: Ingesting live civic issue from citizen mobile app...", "info");
  
  setTimeout(() => {
    // Step 1: Create a high priority pothole issue
    const demoComplaint = window.store.addComplaint({
      description: "Severe road cave-in near Central Hospital ambulance entry corridor.",
      issue_type: "POTHOLE",
      severity: "CRITICAL",
      severity_score: 0.96,
      department: "ROAD_DEPARTMENT",
      location_text: "Hospital Main Gate, Station Road",
      latitude: 16.7065,
      longitude: 74.2445,
      evidence: ["Hospital emergency access blocked", "Deep crater > 22cm depth"]
    });

    switchTab("command");
    if (mapInstance) {
      mapInstance.flyTo([demoComplaint.latitude, demoComplaint.longitude], 15, { duration: 1.2 });
    }

    showToast("AI Agent Acted", `Step 2: Classified ${demoComplaint.complaint_id} as CRITICAL. Routed to ROAD_DEPARTMENT.`, "success");

    // Step 2: Auto dispatch worker
    setTimeout(() => {
      window.store.assignWorker(demoComplaint.complaint_id, "WRK001");
      showToast("Worker Dispatched", `Step 3: Field Operative Ramesh Pawar dispatched to ${demoComplaint.complaint_id}.`, "info");

      // Step 3: Simulate worker resolution & submit verification evidence
      setTimeout(() => {
        demoComplaint.status = "VERIFICATION";
        demoComplaint.resolutions = [{
          resolution_id: `RES-${demoComplaint.complaint_id}`,
          complaint_id: demoComplaint.complaint_id,
          worker_id: "WRK001",
          resolution_description: "Emergency asphalt cold-mix deployed and steamroller leveled.",
          after_image_url: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=80",
          submitted_at: new Date().toISOString(),
          verification_status: "PENDING",
          verification_confidence: 0.94,
          verification_reason: "After-image shows restored road surface and cleared emergency access."
        }];
        window.store.updateComplaint(demoComplaint.complaint_id, demoComplaint);

        switchTab("verification");
        showToast("Verification Studio", `Step 4: Worker submitted completion evidence. Ready for authority audit!`, "info");
      }, 2500);
    }, 2200);
  }, 1000);
}

// --- Toast Notification System ---
function showToast(title, message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  const colorMap = {
    info: "border-cyan-500/40 bg-slate-900 text-cyan-300",
    success: "border-emerald-500/40 bg-slate-900 text-emerald-300",
    warning: "border-amber-500/40 bg-slate-900 text-amber-300"
  };

  toast.className = `pointer-events-auto p-4 rounded-xl border ${colorMap[type] || colorMap.info} shadow-2xl glass-panel max-w-sm transition-all transform translate-y-2 opacity-0 flex items-start gap-3`;
  toast.innerHTML = `
    <div class="mt-0.5"><i data-lucide="${type === 'success' ? 'check-circle' : type === 'warning' ? 'alert-triangle' : 'info'}" class="w-4 h-4"></i></div>
    <div class="flex-1">
      <div class="font-bold text-xs text-white">${title}</div>
      <div class="text-[11px] text-slate-300 mt-0.5 leading-relaxed">${message}</div>
    </div>
  `;

  container.appendChild(toast);
  safeCreateIcons();

  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("translate-y-2", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- Filter Handling ---
function applyFilters() {
  activeFilters.search = document.getElementById("filter-search").value;
  activeFilters.status = document.getElementById("filter-status").value;
  activeFilters.department = document.getElementById("filter-department").value;
  activeFilters.severity = document.getElementById("filter-severity").value;
  activeFilters.sortBy = document.getElementById("filter-sort").value;
  renderComplaintsTable();
  safeCreateIcons();
}

function resetFilters() {
  document.getElementById("filter-search").value = "";
  document.getElementById("filter-status").value = "ALL";
  document.getElementById("filter-department").value = "ALL";
  document.getElementById("filter-severity").value = "ALL";
  document.getElementById("filter-sort").value = "date";
  applyFilters();
}
