/**
 * Smart Civic Issue Resolution Agent - Frontend Controller
 * Author: Samyak (Citizen Frontend Lead)
 * Team: Faik (AI/Agent Brain), Piyush (Agentic Workflow/Backend), 
 *       Samyak (Citizen Frontend), Jaydeep (Admin/Verification)
 */

// ==========================================
// 1. Centralized API Configuration & Client
// ==========================================
const API_BASE_URL = "http://localhost:8000/api";

let isBackendAvailable = false;
let currentComplaint = null;
let slaInterval = null;
let slaRemainingSeconds = 48 * 3600; // 48 hours in seconds
let activeFilter = 'ALL';
let isSimulatingVoice = false;

// API functions as specified in requirements
async function submitComplaint(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/complaints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setApiOnlineState(true);
    return data;
  } catch (err) {
    console.warn("API unavailable, falling back to Demo Mode:", err.message);
    setApiOnlineState(false);
    return mockSubmitComplaint(payload);
  }
}

async function analyzeComplaint(id, payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/complaints/${id}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setApiOnlineState(true);
    return data;
  } catch (err) {
    console.warn("API unavailable, running pipeline in Demo Mode:", err.message);
    setApiOnlineState(false);
    return null; // Pipeline handled by demo runner
  }
}

async function getComplaint(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/complaints/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setApiOnlineState(true);
    return data;
  } catch (err) {
    console.warn("API unavailable, using mock complaint:", err.message);
    setApiOnlineState(false);
    return currentComplaint;
  }
}

async function getComplaintStatus(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/complaints/${id}/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setApiOnlineState(true);
    return data;
  } catch (err) {
    console.warn("API unavailable, using mock status:", err.message);
    setApiOnlineState(false);
    return currentComplaint ? currentComplaint.status : 'SUBMITTED';
  }
}

async function verifyResolution(id, proofData) {
  try {
    const res = await fetch(`${API_BASE_URL}/complaints/${id}/verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proofData)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setApiOnlineState(true);
    return data;
  } catch (err) {
    console.warn("API unavailable, verifying in Demo Mode:", err.message);
    setApiOnlineState(false);
    return { verified: proofData.pass, score: proofData.pass ? 96 : 34 };
  }
}

function setApiOnlineState(online) {
  isBackendAvailable = online;
  const statusBadge = document.getElementById("api-status-badge");
  const statusText = document.getElementById("api-status-text");
  const statusDot = document.getElementById("api-status-dot");
  if (!statusBadge) return;

  if (online) {
    statusBadge.className = "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/70 border border-emerald-500/30 text-emerald-400";
    statusText.innerText = "API: Connected (localhost:8000)";
    statusDot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
  } else {
    statusBadge.className = "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-950/70 border border-cyan-500/30 text-cyan-300";
    statusText.innerText = "Mode: Autonomous Demo (Auto-Fallback)";
    statusDot.className = "w-2 h-2 rounded-full bg-cyan-400";
  }
}

// ==========================================
// 2. Demo Presets & Mock Data Generation
// ==========================================
let selectedCategory = 'pothole';
let selectedSeverity = 'HIGH';

const DEMO_PRESETS = {
  pothole: {
    category: "Pothole",
    title: "Large pothole near college gate",
    desc: "Large pothole near college gate. Vehicles are having difficulty passing through it and two-wheelers are swerving dangerously into oncoming traffic.",
    location: "Near College Gate, Sector 4, North Zone [18.5204° N, 73.8567° E]",
    latitude: "18.5204° N",
    longitude: "73.8567° E",
    ward: "Zone 4 (North)",
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
    repairProof: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    expectedIssue: "Pothole & Asphalt Subsidence",
    confidence: "94%",
    severity: "HIGH",
    priority: "87/100",
    department: "Roads & Infrastructure",
    sla: 48,
    duplicateInfo: "No nearby matching complaint"
  },
  garbage: {
    category: "Garbage",
    title: "Overflowing commercial garbage dump",
    desc: "Severe garbage accumulation overflowing on pedestrian pathway behind market plaza. Causing foul odor and stray animals gathering.",
    location: "Market Plaza Alley, East Ward [18.5312° N, 73.8641° E]",
    latitude: "18.5312° N",
    longitude: "73.8641° E",
    ward: "East Ward (Sector 2)",
    image: "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80",
    repairProof: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
    expectedIssue: "Overflowing Garbage Dump",
    confidence: "98%",
    severity: "MEDIUM",
    priority: "74/100",
    department: "Solid Waste Management",
    sla: 24,
    duplicateInfo: "Clustered with 1 neighborhood report (Merged context)"
  },
  streetlight: {
    category: "Streetlight",
    title: "Damaged streetlight near crossing",
    desc: "High mast streetlight pole #48 fixture shattered after storm, dangling wires exposed creating a dangerous dark blindspot.",
    location: "Ring Road Crossing 7, West Zone [18.5140° N, 73.8392° E]",
    latitude: "18.5140° N",
    longitude: "73.8392° E",
    ward: "West Zone (Grid 7)",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80",
    repairProof: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80",
    expectedIssue: "Damaged Streetlight & Exposed Wires",
    confidence: "96%",
    severity: "CRITICAL",
    priority: "92/100",
    department: "Electrical & Public Lighting",
    sla: 12,
    duplicateInfo: "No nearby matching complaint"
  },
  water: {
    category: "Water Leakage",
    title: "Burst water supply pipe",
    desc: "Major drinking water pipeline rupture under pavement. High pressure clean water flooding roadway and eroding foundation.",
    location: "Main Avenue & 5th Cross, Central Ward [18.5289° N, 73.8519° E]",
    latitude: "18.5289° N",
    longitude: "73.8519° E",
    ward: "Central Ward (Zone 1)",
    image: "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=600&q=80",
    repairProof: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
    expectedIssue: "High-Pressure Water Main Burst",
    confidence: "97%",
    severity: "CRITICAL",
    priority: "95/100",
    department: "Water Supply & Sewerage Board",
    sla: 12,
    duplicateInfo: "No nearby matching complaint"
  },
  drainage: {
    category: "Drainage",
    title: "Clogged stormwater drainage culvert",
    desc: "Stormwater culvert covered in silt, construction debris and trash. Blackwater backing up and flooding sidewalk during light rain.",
    location: "Subway Underpass Lane, South Ward [18.5085° N, 73.8421° E]",
    latitude: "18.5085° N",
    longitude: "73.8421° E",
    ward: "South Ward (Drainage Div)",
    image: "https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?auto=format&fit=crop&w=600&q=80",
    repairProof: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    expectedIssue: "Blocked Stormwater Culvert & Siltation",
    confidence: "95%",
    severity: "HIGH",
    priority: "84/100",
    department: "Stormwater & Drainage Division",
    sla: 24,
    duplicateInfo: "No nearby matching complaint"
  },
  other: {
    category: "Other",
    title: "Damaged pedestrian safety barrier",
    desc: "Metal pedestrian barrier detached with sharp jagged edge near school playground. Concrete pavement slabs broken and uneven.",
    location: "Green Park Perimeter, Ward 8 [18.5221° N, 73.8710° E]",
    latitude: "18.5221° N",
    longitude: "73.8710° E",
    ward: "Ward 8 (Public Works)",
    image: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=600&q=80",
    repairProof: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
    expectedIssue: "Damaged Municipal Safety Barrier",
    confidence: "93%",
    severity: "MEDIUM",
    priority: "68/100",
    department: "Municipal Civil Works & Parks",
    sla: 48,
    duplicateInfo: "No nearby matching complaint"
  }
};

let currentPresetKey = 'pothole';

// Agent Pipeline Node Definitions (9 Nodes)
const AGENT_NODES = [
  {
    id: "citizen_report",
    name: "Citizen Report",
    icon: "file-text",
    explanation: "Multimodal ingestion validating text, geo-coordinates, and visual evidence.",
    decision: "Valid citizen report verified. Payload structured."
  },
  {
    id: "evidence_agent",
    name: "Evidence Agent",
    icon: "scan",
    explanation: "Computer vision analyzing image features, depth degradation & timestamp metadata.",
    decision: "Surface rupture detected: 42cm diameter, asphalt subsidence confirmed (Confidence: 94%)."
  },
  {
    id: "severity_agent",
    name: "Severity Agent",
    icon: "gauge",
    explanation: "Calculating danger matrix, traffic flow impact & pedestrian hazard risk.",
    decision: "Severity calculated: HIGH • Priority Score: 87/100 (School & bus transit corridor)."
  },
  {
    id: "duplicate_agent",
    name: "Duplicate Agent",
    icon: "copy-check",
    explanation: "Geospatial vector clustering checking 500m radius for redundant reports.",
    decision: "Scanned 14 active records in 500m zone. 0 duplicates found. Unique complaint validated."
  },
  {
    id: "routing_agent",
    name: "Department Routing Agent",
    icon: "network",
    explanation: "Taxonomy engine auto-assigning municipal jurisdiction and dispatch queue.",
    decision: "Classified: Roads & Infrastructure • Division: Zone 4 Asphalt Maintenance Unit."
  },
  {
    id: "complaint_gen",
    name: "Complaint Generation",
    icon: "hash",
    explanation: "Synthesizing structured immutable civic record with cryptographic hash.",
    decision: "Generated Complaint ID CIV-2026-00124. Record dispatched to field ledger."
  },
  {
    id: "monitoring_agent",
    name: "Monitoring Agent",
    icon: "eye",
    explanation: "Autonomous watchdog tracking lifecycle milestones and SLA compliance.",
    decision: "Autonomous monitor initialized. Webhooks active for worker check-in."
  },
  {
    id: "sla_monitoring",
    name: "SLA Monitoring",
    icon: "clock",
    explanation: "Dynamic 48-hour resolution clock with automated escalation protocol.",
    decision: "SLA target locked: 48 hours. Escalation rule: Escalate to Zonal Engineer at T-12h."
  },
  {
    id: "resolution_verification",
    name: "Resolution Verification",
    icon: "shield-check",
    explanation: "Dual-photo computer vision pipeline armed for before/after comparison.",
    decision: "Verification protocol armed. Baseline visual embeddings registered."
  }
];

// Activity and Trace Log Store
let activityLogs = [
  { time: "10:42:11", agent: "Evidence Agent", msg: "Analyzed image: Detected asphalt depression 42cm diam., depth ~8cm", category: "EVIDENCE" },
  { time: "10:42:13", agent: "Issue Classifier", msg: "Issue classified as Pothole (Confidence: 94%)", category: "CLASSIFICATION" },
  { time: "10:42:14", agent: "Severity Agent", msg: "Severity calculated: HIGH (Priority score: 87/100)", category: "SEVERITY" },
  { time: "10:42:15", agent: "Department Router", msg: "Department routed to Roads & Infrastructure", category: "ROUTING" },
  { time: "10:42:16", agent: "Complaint Engine", msg: "Complaint created: CIV-2026-00124", category: "ACTION" },
  { time: "10:42:18", agent: "Monitoring Agent", msg: "Started 48h SLA timer and watchdog daemon", category: "MONITORING" }
];

let myComplaintsList = [
  {
    id: "CIV-2026-00124",
    issue: "Pothole",
    location: "Near College Gate, Sector 4",
    dept: "Roads & Infrastructure",
    severity: "HIGH",
    priority: "87/100",
    status: "SUBMITTED",
    sla: "47h 58m",
    timestamp: "Today, 10:42 AM",
    activeStep: 5
  },
  {
    id: "CIV-2026-00089",
    issue: "Overflowing Garbage Dump",
    location: "Market Plaza Alley, East Ward",
    dept: "Solid Waste Management",
    severity: "MEDIUM",
    priority: "74/100",
    status: "WORKER_ASSIGNED",
    sla: "18h 12m",
    timestamp: "Yesterday, 03:15 PM",
    activeStep: 5
  },
  {
    id: "CIV-2026-00062",
    issue: "Damaged Streetlight",
    location: "Ring Road Crossing 7",
    dept: "Electrical & Lighting",
    severity: "CRITICAL",
    priority: "92/100",
    status: "RESOLVED",
    sla: "Completed in 9h",
    timestamp: "Sep 18, 08:30 PM",
    activeStep: 8
  }
];

function mockSubmitComplaint(payload) {
  const cid = `CIV-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  return {
    id: cid,
    status: "SUBMITTED",
    receivedAt: new Date().toISOString()
  };
}

// ==========================================
// 3. UI Initialization
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  renderAgentNodes();
  renderTraceLogs();
  renderMyComplaints();
  initVoiceVisualizer();
  loadPreset(currentPresetKey);
  setupDragAndDrop();
  updateCharCount();

  // Ping backend check
  checkBackendHealth();

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(1200) });
    setApiOnlineState(res.ok);
  } catch (e) {
    setApiOnlineState(false);
  }
}

// ==========================================
// 4. Tab Navigation
// ==========================================
window.switchTab = function(tabName) {
  const tabs = ['citizen-report', 'my-complaints', 'agent-activity'];
  tabs.forEach(t => {
    const el = document.getElementById(`view-${t}`);
    const btn = document.getElementById(`tab-btn-${t}`);
    if (el) {
      if (t === tabName) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
    if (btn) {
      if (t === tabName) {
        btn.className = "px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm transition-all";
      } else {
        btn.className = "px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all";
      }
    }
  });

  if (window.lucide) window.lucide.createIcons();
};

// ==========================================
// 5. Presets & Form Controls
// ==========================================

// Category Card Selection
window.selectCategory = function(catKey) {
  selectedCategory = catKey;
  
  // Update category cards visual state
  document.querySelectorAll("#category-cards-grid .category-card").forEach(card => {
    const isTarget = card.dataset.category === catKey;
    const dot = card.querySelector(".check-dot");
    const icon = card.querySelector(".category-icon");
    
    if (isTarget) {
      card.classList.add("active");
      if (dot) dot.classList.remove("hidden");
      if (icon) {
        icon.classList.remove("text-slate-400", "bg-slate-800");
        icon.classList.add("text-cyan-400", "bg-cyan-950/60");
      }
    } else {
      card.classList.remove("active");
      if (dot) dot.classList.add("hidden");
      if (icon) {
        icon.classList.remove("text-cyan-400", "bg-cyan-950/60");
        icon.classList.add("text-slate-400", "bg-slate-800");
      }
    }
  });

  // Update label
  const label = document.getElementById("selected-category-label");
  const p = DEMO_PRESETS[catKey];
  if (label && p) {
    label.innerText = p.category;
  }

  // Load preset data corresponding to this category
  loadPreset(catKey);

  // Clear category error from alert if open
  clearValidationError("category");
  if (window.lucide) window.lucide.createIcons();
};

// Severity Selection
window.selectSeverity = function(sev) {
  selectedSeverity = sev;

  // Clear previous active classes
  document.querySelectorAll("#severity-selector-grid .severity-card").forEach(card => {
    card.classList.remove("active-low", "active-medium", "active-high", "active-critical");
    if (card.dataset.severity === sev) {
      if (sev === "LOW") card.classList.add("active-low");
      else if (sev === "MEDIUM") card.classList.add("active-medium");
      else if (sev === "HIGH") card.classList.add("active-high");
      else if (sev === "CRITICAL") card.classList.add("active-critical");
    }
  });

  // Update badge
  const badge = document.getElementById("selected-severity-badge");
  if (badge) {
    if (sev === "LOW") {
      badge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
      badge.innerText = "LOW PRIORITY";
    } else if (sev === "MEDIUM") {
      badge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40";
      badge.innerText = "MEDIUM PRIORITY";
    } else if (sev === "HIGH") {
      badge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40";
      badge.innerText = "HIGH PRIORITY";
    } else if (sev === "CRITICAL") {
      badge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40";
      badge.innerText = "CRITICAL PRIORITY";
    }
  }

  clearValidationError("severity");
};

// Character Counter
window.updateCharCount = function() {
  const descEl = document.getElementById("issue-description");
  const countEl = document.getElementById("char-count");
  const hintEl = document.getElementById("char-hint");
  if (!descEl) return;

  const len = descEl.value.trim().length;
  if (countEl) {
    countEl.innerText = `${len} chars`;
  }

  if (hintEl) {
    if (len === 0) {
      hintEl.className = "text-slate-400";
      hintEl.innerText = "Min 10 characters recommended for NLP routing";
    } else if (len < 10) {
      hintEl.className = "text-amber-400";
      hintEl.innerText = `Add ${10 - len} more characters for NLP precision`;
    } else {
      hintEl.className = "text-emerald-400";
      hintEl.innerText = "Description length optimal for semantic routing";
    }
  }

  if (len >= 10) {
    clearValidationError("description");
  }
};

// Drag & Drop Image Handling
function setupDragAndDrop() {
  const dropZone = document.getElementById("image-drop-zone");
  if (!dropZone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("drag-over");
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("drag-over");
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files[0]) {
      handleDroppedFile(files[0]);
    }
  }, false);
}

function handleDroppedFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast("Please upload a valid image file (JPG, PNG, WEBP)", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    displayUploadedImage(e.target.result, file.name);
  };
  reader.readAsDataURL(file);
}

function displayUploadedImage(dataUrl, fileName = "Citizen Upload") {
  const imgPrev = document.getElementById("image-preview");
  const imgPlaceholder = document.getElementById("image-placeholder");
  const previewWrapper = document.getElementById("preview-wrapper");
  const metaBadge = document.getElementById("image-metadata-badge");

  if (imgPrev) {
    imgPrev.src = dataUrl;
    imgPrev.classList.remove("hidden");
  }
  if (previewWrapper) previewWrapper.classList.remove("hidden");
  if (imgPlaceholder) imgPlaceholder.classList.add("hidden");
  if (metaBadge) metaBadge.innerText = fileName.length > 15 ? fileName.substring(0, 12) + "..." : fileName;

  clearValidationError("image");
  if (window.lucide) window.lucide.createIcons();
}

window.triggerFileInput = function(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const fileInput = document.getElementById("image-file-input");
  if (fileInput) fileInput.click();
};

window.removeUploadedImage = function(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const imgPrev = document.getElementById("image-preview");
  const imgPlaceholder = document.getElementById("image-placeholder");
  const previewWrapper = document.getElementById("preview-wrapper");
  const fileInput = document.getElementById("image-file-input");

  if (imgPrev) {
    imgPrev.src = "";
    imgPrev.classList.add("hidden");
  }
  if (previewWrapper) previewWrapper.classList.add("hidden");
  if (imgPlaceholder) imgPlaceholder.classList.remove("hidden");
  if (fileInput) fileInput.value = "";
  if (window.lucide) window.lucide.createIcons();
};

window.loadPresetPhoto = function(catKey) {
  const p = DEMO_PRESETS[catKey];
  if (p && p.image) {
    displayUploadedImage(p.image, `${p.category} Proof`);
    showToast(`Loaded ${p.category} evidence photo`, "info");
  }
};

window.loadPreset = function(presetKey) {
  currentPresetKey = presetKey;
  selectedCategory = presetKey;
  const p = DEMO_PRESETS[presetKey];
  if (!p) return;

  const descEl = document.getElementById("issue-description");
  const locEl = document.getElementById("issue-location");

  if (descEl) descEl.value = p.desc;
  if (locEl) locEl.value = p.location;

  // Update Lat/Long display
  if (p.latitude) {
    const latEl = document.getElementById("display-latitude");
    const lngEl = document.getElementById("display-longitude");
    const wardEl = document.getElementById("display-ward");
    if (latEl) latEl.innerText = p.latitude;
    if (lngEl) lngEl.innerText = p.longitude;
    if (wardEl) wardEl.innerText = p.ward || "Zone 4 (North)";
  }

  // Update Image
  displayUploadedImage(p.image, `${p.category} Photo`);

  // Update Category Cards
  document.querySelectorAll("#category-cards-grid .category-card").forEach(card => {
    const isTarget = card.dataset.category === presetKey;
    const dot = card.querySelector(".check-dot");
    const icon = card.querySelector(".category-icon");
    if (isTarget) {
      card.classList.add("active");
      if (dot) dot.classList.remove("hidden");
      if (icon) {
        icon.classList.remove("text-slate-400", "bg-slate-800");
        icon.classList.add("text-cyan-400", "bg-cyan-950/60");
      }
    } else {
      card.classList.remove("active");
      if (dot) dot.classList.add("hidden");
      if (icon) {
        icon.classList.remove("text-cyan-400", "bg-cyan-950/60");
        icon.classList.add("text-slate-400", "bg-slate-800");
      }
    }
  });

  const catLabel = document.getElementById("selected-category-label");
  if (catLabel) catLabel.innerText = p.category;

  // Update preset buttons
  document.querySelectorAll(".preset-btn").forEach(btn => {
    if (btn.dataset.preset === presetKey) {
      btn.className = "preset-btn px-2.5 py-1 text-xs rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-medium transition-all cursor-pointer";
    } else {
      btn.className = "preset-btn px-2.5 py-1 text-xs rounded-md bg-slate-800/80 text-slate-300 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer";
    }
  });

  // Select matching severity
  if (p.severity) {
    selectSeverity(p.severity);
  }

  updateCharCount();
  if (window.lucide) window.lucide.createIcons();
};

window.handleImageUpload = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  handleDroppedFile(file);
};

// Location Detection with GPS Display
window.detectLocation = function() {
  const locEl = document.getElementById("issue-location");
  const locBtn = document.getElementById("loc-btn-text");
  const latEl = document.getElementById("display-latitude");
  const lngEl = document.getElementById("display-longitude");
  const accEl = document.getElementById("display-accuracy");
  const wardEl = document.getElementById("display-ward");

  if (locBtn) locBtn.innerText = "Acquiring GPS...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        const accuracy = Math.round(pos.coords.accuracy || 4);

        if (locEl) locEl.value = `Geo-Verified Location [${lat}° N, ${lng}° E] (Accuracy: ±${accuracy}m)`;
        if (latEl) latEl.innerText = `${lat}° N`;
        if (lngEl) lngEl.innerText = `${lng}° E`;
        if (accEl) accEl.innerText = `±${accuracy}m (Lock)`;
        if (wardEl) wardEl.innerText = "Zone 4 (North)";
        if (locBtn) locBtn.innerText = "GPS Locked";
        clearValidationError("location");
        showToast("GPS coordinates synchronized with satellite telemetry", "success");
      },
      () => {
        // Fallback simulation coordinates
        if (locEl) locEl.value = "College Gate, Sector 4, North Zone [18.5204° N, 73.8567° E]";
        if (latEl) latEl.innerText = "18.5204° N";
        if (lngEl) lngEl.innerText = "73.8567° E";
        if (accEl) accEl.innerText = "±4m (Simulated)";
        if (wardEl) wardEl.innerText = "Zone 4 (North)";
        if (locBtn) locBtn.innerText = "GPS Locked";
        clearValidationError("location");
        showToast("Simulated GPS locked at College Gate, Sector 4", "info");
      },
      { timeout: 3500 }
    );
  } else {
    if (locEl) locEl.value = "College Gate, Sector 4, North Zone [18.5204° N, 73.8567° E]";
    if (latEl) latEl.innerText = "18.5204° N";
    if (lngEl) lngEl.innerText = "73.8567° E";
    if (accEl) accEl.innerText = "±4m (Simulated)";
    if (wardEl) wardEl.innerText = "Zone 4 (North)";
    if (locBtn) locBtn.innerText = "GPS Locked";
    clearValidationError("location");
  }
};

window.setLocationPreset = function(type) {
  const locEl = document.getElementById("issue-location");
  const latEl = document.getElementById("display-latitude");
  const lngEl = document.getElementById("display-longitude");
  const wardEl = document.getElementById("display-ward");

  if (type === 'college') {
    if (locEl) locEl.value = "Near College Gate, Sector 4, North Zone [18.5204° N, 73.8567° E]";
    if (latEl) latEl.innerText = "18.5204° N";
    if (lngEl) lngEl.innerText = "73.8567° E";
    if (wardEl) wardEl.innerText = "Zone 4 (North)";
  } else if (type === 'market') {
    if (locEl) locEl.value = "Market Plaza Alley, East Ward [18.5312° N, 73.8641° E]";
    if (latEl) latEl.innerText = "18.5312° N";
    if (lngEl) lngEl.innerText = "73.8641° E";
    if (wardEl) wardEl.innerText = "East Ward (Sector 2)";
  } else if (type === 'ringroad') {
    if (locEl) locEl.value = "Ring Road Crossing 7, West Zone [18.5140° N, 73.8392° E]";
    if (latEl) latEl.innerText = "18.5140° N";
    if (lngEl) lngEl.innerText = "73.8392° E";
    if (wardEl) wardEl.innerText = "West Zone (Grid 7)";
  } else if (type === 'central') {
    if (locEl) locEl.value = "Main Avenue & 5th Cross, Central Ward [18.5289° N, 73.8519° E]";
    if (latEl) latEl.innerText = "18.5289° N";
    if (lngEl) lngEl.innerText = "73.8519° E";
    if (wardEl) wardEl.innerText = "Central Ward (Zone 1)";
  }
  clearValidationError("location");
  showToast("Updated location and ward boundary", "info");
};

// Form Validation
function clearValidationError(type) {
  const alertEl = document.getElementById("form-validation-alert");
  const listEl = document.getElementById("validation-errors-list");
  if (!alertEl || !listEl) return;

  const item = listEl.querySelector(`[data-error-type="${type}"]`);
  if (item) item.remove();

  if (listEl.children.length === 0) {
    alertEl.classList.add("hidden");
  }

  // Remove input-error classes
  if (type === "description") {
    document.getElementById("issue-description")?.classList.remove("input-error");
  } else if (type === "location") {
    document.getElementById("issue-location")?.classList.remove("input-error");
  } else if (type === "image") {
    document.getElementById("image-drop-zone")?.classList.remove("input-error");
  }
}

window.validateForm = function() {
  const errors = [];
  const imgPrev = document.getElementById("image-preview");
  const descEl = document.getElementById("issue-description");
  const locEl = document.getElementById("issue-location");

  const hasImage = imgPrev && !imgPrev.classList.contains("hidden") && imgPrev.src && imgPrev.src.length > 10;
  const descText = descEl ? descEl.value.trim() : "";
  const locText = locEl ? locEl.value.trim() : "";

  if (!hasImage) {
    errors.push({
      type: "image",
      msg: "Visual Evidence: Please upload a photo or select one of the demo photos."
    });
    document.getElementById("image-drop-zone")?.classList.add("input-error");
  }

  if (descText.length < 10) {
    errors.push({
      type: "description",
      msg: "Description: Please provide at least 10 characters describing the civic issue."
    });
    descEl?.classList.add("input-error");
  }

  if (locText.length < 5) {
    errors.push({
      type: "location",
      msg: "Location: Please provide a landmark/address or click 'Detect GPS'."
    });
    locEl?.classList.add("input-error");
  }

  const alertEl = document.getElementById("form-validation-alert");
  const listEl = document.getElementById("validation-errors-list");

  if (errors.length > 0) {
    if (alertEl && listEl) {
      listEl.innerHTML = errors.map(err => `
        <li data-error-type="${err.type}">${err.msg}</li>
      `).join("");
      alertEl.classList.remove("hidden");
      alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    showToast("Please complete the required fields highlighted in red.", "error");
    if (window.lucide) window.lucide.createIcons();
    return false;
  }

  if (alertEl) alertEl.classList.add("hidden");
  return true;
};

// Form Submission with Loading State
window.validateAndRunPipeline = async function() {
  if (!validateForm()) {
    return;
  }

  // Show Loading Progress State
  const progressContainer = document.getElementById("submission-progress-container");
  const progressBar = document.getElementById("submission-progress-bar");
  const progressPercent = document.getElementById("submission-percent-label");
  const progressStep = document.getElementById("submission-step-label");

  if (progressContainer) progressContainer.classList.remove("hidden");
  if (progressBar) progressBar.style.width = "8%";
  if (progressPercent) progressPercent.innerText = "8%";
  if (progressStep) {
    progressStep.innerHTML = `<i data-lucide="cpu" class="w-3.5 h-3.5 text-cyan-400 animate-spin"></i> <span>Initializing AI Swarm...</span>`;
  }
  if (window.lucide) window.lucide.createIcons();

  // Run the core agent pipeline
  await runAnalysisPipeline();
};

// Success Confirmation Modal
window.openSuccessModal = function(complaint) {
  const modal = document.getElementById("complaint-success-modal");
  if (!modal || !complaint) return;

  const cidEl = document.getElementById("modal-success-cid");
  const catEl = document.getElementById("modal-success-category");
  const sevEl = document.getElementById("modal-success-severity");
  const confEl = document.getElementById("modal-success-confidence");
  const deptEl = document.getElementById("modal-success-dept");
  const slaEl = document.getElementById("modal-success-sla");
  const locEl = document.getElementById("modal-success-loc");

  if (cidEl) cidEl.innerText = complaint.id || "CIV-2026-00124";
  if (catEl) catEl.innerText = complaint.issue || selectedCategory.toUpperCase();
  if (sevEl) {
    sevEl.innerText = complaint.severity || selectedSeverity;
    sevEl.className = complaint.severity === 'CRITICAL' ? 'font-bold text-rose-400' :
                      complaint.severity === 'HIGH' ? 'font-bold text-amber-400' :
                      complaint.severity === 'MEDIUM' ? 'font-bold text-blue-400' : 'font-bold text-emerald-400';
  }
  if (confEl) confEl.innerText = complaint.confidence || "94%";
  if (deptEl) deptEl.innerHTML = `<i data-lucide="building-2" class="w-3 h-3 text-cyan-400 inline"></i> ${complaint.department || 'Roads & Infrastructure'}`;
  if (slaEl) slaEl.innerText = `${complaint.slaHours || 48} Hours`;
  if (locEl) locEl.innerText = complaint.location || "North Zone";

  modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
};

window.closeSuccessModal = function() {
  const modal = document.getElementById("complaint-success-modal");
  if (modal) modal.classList.add("hidden");
};

window.copySuccessComplaintId = function() {
  const cidEl = document.getElementById("modal-success-cid");
  const btnLabel = document.getElementById("copy-btn-label");
  const text = cidEl ? cidEl.innerText.trim() : "CIV-2026-00124";

  navigator.clipboard.writeText(text).then(() => {
    if (btnLabel) btnLabel.innerText = "Copied!";
    showToast(`Copied ${text} to clipboard`, "success");
    setTimeout(() => {
      if (btnLabel) btnLabel.innerText = "Copy ID";
    }, 2000);
  }).catch(() => {
    showToast(`Complaint ID: ${text}`, "info");
  });
};

window.viewRegisteredComplaintInPipeline = function() {
  closeSuccessModal();
  const pipelineEl = document.getElementById("pipeline-section");
  if (pipelineEl) {
    pipelineEl.classList.remove("hidden");
    pipelineEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

window.resetReportForm = function() {
  const descEl = document.getElementById("issue-description");
  if (descEl) descEl.value = "";
  updateCharCount();
  const alertEl = document.getElementById("form-validation-alert");
  if (alertEl) alertEl.classList.add("hidden");
  const progressContainer = document.getElementById("submission-progress-container");
  if (progressContainer) progressContainer.classList.add("hidden");
  document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
};

window.toggleVoiceInput = function() {
  isSimulatingVoice = !isSimulatingVoice;
  const voiceBtn = document.getElementById("voice-btn");
  const waveEl = document.getElementById("voice-wave-container");
  const descEl = document.getElementById("issue-description");

  if (isSimulatingVoice) {
    voiceBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse";
    voiceBtn.innerHTML = `<i data-lucide="mic-off" class="w-3.5 h-3.5"></i> Stop Recording`;
    waveEl.classList.remove("hidden");

    // Speech recognition simulation
    setTimeout(() => {
      if (isSimulatingVoice && descEl) {
        const p = DEMO_PRESETS[selectedCategory] || DEMO_PRESETS.pothole;
        descEl.value = p.desc;
        updateCharCount();
        toggleVoiceInput();
        showToast("Voice transcription completed successfully", "success");
      }
    }, 2800);
  } else {
    voiceBtn.className = "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-500/40 cursor-pointer";
    voiceBtn.innerHTML = `<i data-lucide="mic" class="w-3.5 h-3.5 text-cyan-400"></i> Voice Input`;
    waveEl.classList.add("hidden");
  }
  if (window.lucide) window.lucide.createIcons();
};

function initVoiceVisualizer() {
  const container = document.getElementById("voice-bars");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const bar = document.createElement("div");
    bar.className = "voice-bar w-1 bg-cyan-400 rounded-full h-2";
    bar.style.animationDelay = `${(i * 0.12).toFixed(2)}s`;
    container.appendChild(bar);
  }
}

// ==========================================
// 6. Agent Pipeline Visualizer
// ==========================================
function renderAgentNodes() {
  const grid = document.getElementById("agent-nodes-grid");
  if (!grid) return;
  grid.innerHTML = "";

  AGENT_NODES.forEach((node, index) => {
    const nodeEl = document.createElement("div");
    nodeEl.id = `node-${node.id}`;
    nodeEl.className = "agent-node state-pending p-3.5 rounded-xl border relative transition-all duration-300";

    nodeEl.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="node-icon-wrap w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-slate-400 transition-all">
          <i data-lucide="${node.icon}" class="w-4 h-4"></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-xs font-semibold text-slate-200 tracking-wide truncate">${node.name}</h4>
            <span id="badge-${node.id}" class="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              PENDING
            </span>
          </div>
          <p id="desc-${node.id}" class="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            ${node.explanation}
          </p>
        </div>
      </div>
      <div id="glow-bar-${node.id}" class="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent rounded-b-xl transition-all"></div>
    `;

    grid.appendChild(nodeEl);
  });

  if (window.lucide) window.lucide.createIcons();
}

function updateNodeState(nodeId, state, customDecision = null) {
  const nodeEl = document.getElementById(`node-${nodeId}`);
  const badge = document.getElementById(`badge-${nodeId}`);
  const desc = document.getElementById(`desc-${nodeId}`);
  const glow = document.getElementById(`glow-bar-${nodeId}`);
  if (!nodeEl || !badge) return;

  nodeEl.classList.remove("state-pending", "state-active", "state-completed");
  nodeEl.classList.add(`state-${state}`);

  if (state === "active") {
    badge.innerText = "ACTIVE";
    badge.className = "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 animate-pulse";
    if (glow) glow.className = "absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-b-xl shadow-[0_0_8px_#38bdf8]";
  } else if (state === "completed") {
    badge.innerText = "DONE";
    badge.className = "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/50";
    if (customDecision && desc) {
      desc.innerText = customDecision;
      desc.classList.add("text-emerald-300/90");
    }
    if (glow) glow.className = "absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-b-xl";
  } else {
    badge.innerText = "PENDING";
    badge.className = "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700";
    if (glow) glow.className = "absolute bottom-0 left-0 right-0 h-0.5 bg-transparent rounded-b-xl";
  }
}

// ==========================================
// 7. Core Workflow: Run Agent Pipeline
// ==========================================
window.runAnalysisPipeline = async function() {
  const analyzeBtn = document.getElementById("btn-analyze-issue");
  const liveStatusBadge = document.getElementById("live-status-badge");
  const currentStatusText = document.getElementById("current-status-text");
  const preset = DEMO_PRESETS[selectedCategory] || DEMO_PRESETS[currentPresetKey] || DEMO_PRESETS.pothole;
  const description = document.getElementById("issue-description")?.value || preset.desc;
  const location = document.getElementById("issue-location")?.value || preset.location;

  // Progress Bar References
  const progressContainer = document.getElementById("submission-progress-container");
  const progressBar = document.getElementById("submission-progress-bar");
  const progressPercent = document.getElementById("submission-percent-label");
  const progressStep = document.getElementById("submission-step-label");

  if (progressContainer) progressContainer.classList.remove("hidden");
  if (progressBar) progressBar.style.width = "10%";
  if (progressPercent) progressPercent.innerText = "10%";

  // Lock button
  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.className = "w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed flex items-center justify-center gap-2";
    analyzeBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-cyan-400"></i> Agent Swarm Processing...`;
  }

  // Reset pipeline nodes
  AGENT_NODES.forEach(n => updateNodeState(n.id, "pending"));

  // Open the pipeline view and scroll into view smoothly
  document.getElementById("pipeline-section")?.classList.remove("hidden");
  document.getElementById("result-card-section")?.classList.add("hidden");

  // Step timings
  const timelinePhases = [
    {
      node: "citizen_report",
      statusLabel: "THINKING",
      badgeClass: "badge-thinking",
      delay: 550,
      log: `Citizen report validated: "${description.substring(0, 48)}..."`,
      cat: "REPORT"
    },
    {
      node: "evidence_agent",
      statusLabel: "ANALYZING",
      badgeClass: "badge-analyzing",
      delay: 700,
      log: `Evidence Agent: Visual feature extraction matches ${preset.expectedIssue} (${preset.confidence} confidence)`,
      cat: "EVIDENCE"
    },
    {
      node: "severity_agent",
      statusLabel: "DECIDING",
      badgeClass: "badge-deciding",
      delay: 650,
      log: `Severity Agent: Impact score computed at ${preset.priority}, Level: ${selectedSeverity || preset.severity}`,
      cat: "SEVERITY"
    },
    {
      node: "duplicate_agent",
      statusLabel: "ANALYZING",
      badgeClass: "badge-analyzing",
      delay: 600,
      log: `Duplicate Agent: ${preset.duplicateInfo} in 500m radius`,
      cat: "CLUSTER"
    },
    {
      node: "routing_agent",
      statusLabel: "ROUTING",
      badgeClass: "badge-routing",
      delay: 650,
      log: `Department Routing: Routed complaint to ${preset.department}`,
      cat: "ROUTING"
    },
    {
      node: "complaint_gen",
      statusLabel: "DECIDING",
      badgeClass: "badge-deciding",
      delay: 550,
      log: `Complaint Created: CIV-2026-00124 with immutable SLA policy`,
      cat: "ACTION"
    },
    {
      node: "monitoring_agent",
      statusLabel: "MONITORING",
      badgeClass: "badge-monitoring",
      delay: 500,
      log: `Monitoring Agent: Autonomous watchdog dispatched. SLA countdown live.`,
      cat: "MONITORING"
    },
    {
      node: "sla_monitoring",
      statusLabel: "MONITORING",
      badgeClass: "badge-monitoring",
      delay: 500,
      log: `SLA Engine: Locked resolution deadline at ${preset.sla} hours.`,
      cat: "SLA"
    },
    {
      node: "resolution_verification",
      statusLabel: "VERIFYING",
      badgeClass: "badge-verifying",
      delay: 500,
      log: `Verification Agent: Initial reference embeddings saved for before/after comparison.`,
      cat: "VERIFICATION"
    }
  ];

  // Execute sequential loop
  for (let i = 0; i < timelinePhases.length; i++) {
    const phase = timelinePhases[i];
    const nodeDef = AGENT_NODES.find(n => n.id === phase.node);

    // Update progress bar
    const percent = Math.round(((i + 1) / timelinePhases.length) * 100);
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressPercent) progressPercent.innerText = `${percent}%`;
    if (progressStep) {
      progressStep.innerHTML = `<i data-lucide="cpu" class="w-3.5 h-3.5 text-cyan-400 animate-spin"></i> <span>Processing: ${nodeDef ? nodeDef.name : "Agent Swarm"}...</span>`;
    }

    // Update status badge
    if (liveStatusBadge && currentStatusText) {
      currentStatusText.innerText = phase.statusLabel;
      liveStatusBadge.className = `px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider ${phase.badgeClass} flex items-center gap-1.5`;
    }

    // Set active
    updateNodeState(phase.node, "active");
    await sleep(phase.delay);

    // Complete node
    updateNodeState(phase.node, "completed", nodeDef ? nodeDef.decision : null);

    // Push log
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    addTraceLog({
      time: timeStr,
      agent: nodeDef ? nodeDef.name : "Agent Swarm",
      msg: phase.log,
      category: phase.cat
    });
  }

  // Progress Bar Done
  if (progressBar) progressBar.style.width = "100%";
  if (progressPercent) progressPercent.innerText = "100%";
  if (progressStep) {
    progressStep.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i> <span class="text-emerald-300 font-medium">Autonomous Swarm Dispatch Complete</span>`;
  }

  // Build the structured complaint using user choices
  const effectiveSeverity = selectedSeverity || preset.severity;
  const effectivePriority = effectiveSeverity === "CRITICAL" ? "95/100" :
                            effectiveSeverity === "HIGH" ? "87/100" :
                            effectiveSeverity === "MEDIUM" ? "74/100" : "42/100";

  currentComplaint = {
    id: "CIV-2026-00124",
    issue: preset.expectedIssue || (preset.category + " Issue"),
    confidence: preset.confidence,
    severity: effectiveSeverity,
    priority: effectivePriority,
    department: preset.department,
    location: location,
    duplicateInfo: preset.duplicateInfo,
    status: "SUBMITTED",
    slaHours: preset.sla,
    repairProof: preset.repairProof,
    currentStep: 5 // 5 nodes completed out of tracking timeline
  };

  // Render structured card & tracking controls
  renderStructuredComplaintCard(currentComplaint);
  renderTrackingTimeline(currentComplaint.currentStep);
  startSlaCountdown(currentComplaint.slaHours);

  // Restore button
  if (analyzeBtn) {
    analyzeBtn.disabled = false;
    analyzeBtn.className = "w-full py-3.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer";
    analyzeBtn.innerHTML = `<i data-lucide="sparkles" class="w-4 h-4"></i> Re-Analyze Issue`;
  }

  // Open confirmation modal
  setTimeout(() => {
    openSuccessModal(currentComplaint);
    showToast("Complaint registered successfully with autonomous AI tracking!", "success");
  }, 400);

  if (window.lucide) window.lucide.createIcons();
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// 8. Structured Complaint Card & SLA Timer
// ==========================================
function renderStructuredComplaintCard(c) {
  const sec = document.getElementById("result-card-section");
  if (!sec) return;
  sec.classList.remove("hidden");

  // Fill card fields
  document.getElementById("res-cid").innerText = c.id;
  document.getElementById("res-issue").innerText = c.issue;
  document.getElementById("res-confidence").innerText = c.confidence;
  document.getElementById("res-severity").innerText = c.severity;
  document.getElementById("res-priority").innerText = c.priority;
  document.getElementById("res-department").innerText = c.department;
  document.getElementById("res-location").innerText = c.location;
  document.getElementById("res-duplicate").innerText = c.duplicateInfo;
  document.getElementById("res-status").innerText = c.status;

  // Severity styling
  const sevEl = document.getElementById("res-severity");
  if (c.severity === "CRITICAL") {
    sevEl.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40";
  } else if (c.severity === "HIGH") {
    sevEl.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40";
  } else {
    sevEl.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40";
  }

  // Add to My Complaints if not already present
  const exists = myComplaintsList.find(x => x.id === c.id);
  if (!exists) {
    myComplaintsList.unshift({
      id: c.id,
      issue: c.issue,
      location: c.location,
      dept: c.department,
      severity: c.severity,
      priority: c.priority,
      status: c.status,
      sla: `${c.slaHours}h Target`,
      timestamp: "Just now",
      activeStep: c.currentStep
    });
    renderMyComplaints();
  }

  // Smooth scroll to card
  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function startSlaCountdown(hours) {
  if (slaInterval) clearInterval(slaInterval);
  slaRemainingSeconds = hours * 3600;

  function tick() {
    if (slaRemainingSeconds <= 0) {
      document.getElementById("sla-timer-text").innerText = "SLA BREACHED";
      document.getElementById("sla-timer-text").className = "text-rose-400 font-mono font-bold";
      clearInterval(slaInterval);
      return;
    }
    slaRemainingSeconds -= 1;
    const h = Math.floor(slaRemainingSeconds / 3600);
    const m = Math.floor((slaRemainingSeconds % 3600) / 60);
    const s = slaRemainingSeconds % 60;
    const timerEl = document.getElementById("sla-timer-text");
    if (timerEl) {
      timerEl.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }

  tick();
  slaInterval = setInterval(tick, 1000);
}

// ==========================================
// 9. Status Tracking Timeline & Closed-Loop Simulation
// ==========================================
const TRACKING_STEPS = [
  { id: 1, label: "Complaint Submitted", desc: "Citizen request received" },
  { id: 2, label: "Evidence Analyzed", desc: "Vision embeddings extracted" },
  { id: 3, label: "Issue Classified", desc: "NLP & ontology classification" },
  { id: 4, label: "Severity Determined", desc: "Danger matrix evaluated" },
  { id: 5, label: "Department Assigned", desc: "Jurisdiction queue dispatched" },
  { id: 6, label: "Worker Assignment", desc: "Field officer allocated" },
  { id: 7, label: "Repair In Progress", desc: "On-site remediation underway" },
  { id: 8, label: "AI Verification", desc: "Before/After proof validated" },
  { id: 9, label: "Resolved", desc: "Closed-loop verification complete" }
];

function renderTrackingTimeline(currentStep) {
  const container = document.getElementById("tracking-timeline-container");
  if (!container) return;
  container.innerHTML = "";

  TRACKING_STEPS.forEach((step, idx) => {
    const isDone = step.id < currentStep;
    const isActive = step.id === currentStep;
    const isPending = step.id > currentStep;

    const row = document.createElement("div");
    row.className = "flex items-center gap-3 relative";

    let stateIcon = "";
    let stateColor = "";

    if (isDone) {
      stateIcon = `<div class="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 text-xs font-bold">✓</div>`;
      stateColor = "text-slate-200";
    } else if (isActive) {
      stateIcon = `<div class="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400 flex items-center justify-center shrink-0 text-xs font-bold animate-pulse shadow-[0_0_10px_#38bdf8]">●</div>`;
      stateColor = "text-cyan-300 font-semibold";
    } else {
      stateIcon = `<div class="w-7 h-7 rounded-full bg-slate-800/80 text-slate-500 border border-slate-700 flex items-center justify-center shrink-0 text-xs font-bold">○</div>`;
      stateColor = "text-slate-500";
    }

    row.innerHTML = `
      ${stateIcon}
      <div class="flex-1 min-w-0">
        <p class="text-xs ${stateColor}">${step.label}</p>
        <p class="text-[10px] text-slate-500 truncate">${step.desc}</p>
      </div>
    `;

    container.appendChild(row);
  });
}

// Closed-loop simulation button handlers
window.simulateWorkerAssignment = function() {
  if (!currentComplaint) return;
  currentComplaint.currentStep = 6;
  currentComplaint.status = "WORKER_ASSIGNED";
  document.getElementById("res-status").innerText = "WORKER_ASSIGNED";
  renderTrackingTimeline(currentComplaint.currentStep);

  addTraceLog({
    time: getTimestamp(),
    agent: "Dispatch Agent",
    msg: "Worker allocated: Field Officer Rajesh K. (Van #12, Zone 4 Asphalt Maintenance Unit)",
    category: "DISPATCH"
  });

  showToast("Worker Assigned", "Field Officer Rajesh K. (Van #12) dispatched to site.");
};

window.simulateRepair = function() {
  if (!currentComplaint) return;
  currentComplaint.currentStep = 7;
  currentComplaint.status = "IN_REPAIR";
  document.getElementById("res-status").innerText = "IN_REPAIR";
  renderTrackingTimeline(currentComplaint.currentStep);

  addTraceLog({
    time: getTimestamp(),
    agent: "Field Worker Daemon",
    msg: "Worker checked in at GPS coordinates. Cold-mix bituminous asphalt repair underway.",
    category: "REPAIR"
  });

  showToast("Repair In Progress", "Team is actively repairing the site.");
};

window.openUploadRepairProofModal = function() {
  const modal = document.getElementById("repair-proof-modal");
  if (!modal) return;
  modal.classList.remove("hidden");

  // Show before/after preview
  const preset = DEMO_PRESETS[currentPresetKey] || DEMO_PRESETS.pothole;
  document.getElementById("modal-before-img").src = preset.image;
  document.getElementById("modal-after-img").src = preset.repairProof;
  if (window.lucide) window.lucide.createIcons();
};

window.closeModal = function() {
  document.getElementById("repair-proof-modal")?.classList.add("hidden");
};

window.confirmProofUpload = function() {
  closeModal();
  if (!currentComplaint) return;
  currentComplaint.currentStep = 8;
  currentComplaint.status = "VERIFYING";
  document.getElementById("res-status").innerText = "VERIFYING";
  renderTrackingTimeline(currentComplaint.currentStep);

  addTraceLog({
    time: getTimestamp(),
    agent: "Verification Agent",
    msg: "Repair proof uploaded: 1080p post-patch photo submitted with GPS and timestamp EXIF tags.",
    category: "VERIFICATION"
  });

  // Automatically trigger verification result panel
  setTimeout(() => {
    document.getElementById("verification-results-panel")?.classList.remove("hidden");
    document.getElementById("verification-results-panel")?.scrollIntoView({ behavior: 'smooth' });
  }, 400);
};

window.executeVerification = async function(shouldPass) {
  const verResult = document.getElementById("verification-verdict-box");
  const verBadge = document.getElementById("verification-verdict-badge");
  const verTitle = document.getElementById("verification-verdict-title");
  const verDesc = document.getElementById("verification-verdict-desc");
  const verScore = document.getElementById("verification-confidence-score");

  if (shouldPass) {
    currentComplaint.status = "RESOLVED";
    currentComplaint.currentStep = 9;
    document.getElementById("res-status").innerText = "RESOLVED";
    renderTrackingTimeline(9);

    if (verResult) {
      verResult.className = "p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/40";
      verBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400";
      verBadge.innerText = "RESOLVED";
      verTitle.innerText = "AI Verification Passed • 96% Match";
      verDesc.innerText = "Computer vision confirmed complete asphalt seal, flat surface topology, and zero hazardous fissures. Issue closed.";
      verScore.innerText = "AI Confidence: 96%";
    }

    addTraceLog({
      time: getTimestamp(),
      agent: "Resolution Verification",
      msg: "RESOLVED: AI verification confidence 96%. Closed-loop resolution certified.",
      category: "RESOLVED"
    });

    showToast("Issue Resolved!", "AI verification passed with 96% confidence.");
  } else {
    currentComplaint.status = "REOPENED";
    currentComplaint.currentStep = 6;
    document.getElementById("res-status").innerText = "REOPENED (ESCALATED)";
    renderTrackingTimeline(6);

    if (verResult) {
      verResult.className = "p-4 rounded-xl border border-rose-500/40 bg-rose-950/40";
      verBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400";
      verBadge.innerText = "REOPENED";
      verTitle.innerText = "Verification Failed • Escalation Triggered";
      verDesc.innerText = "Repair evidence insufficient. Edge fissures detected (Structural depth delta: 3.2cm). Automated escalation dispatched to Zonal Chief Engineer.";
      verScore.innerText = "AI Confidence: 34% (Sub-threshold)";
    }

    addTraceLog({
      time: getTimestamp(),
      agent: "Resolution Verification",
      msg: "REOPENED: Repair evidence insufficient. Escalation protocol triggered to Chief Engineer.",
      category: "ESCALATION"
    });

    showToast("Complaint Reopened", "Repair proof rejected by AI. Escalated to Chief Engineer.");
  }

  if (window.lucide) window.lucide.createIcons();
};

// ==========================================
// 10. Agent Activity & Prominent Agent Trace Log
// ==========================================
function addTraceLog(item) {
  activityLogs.unshift(item);
  renderTraceLogs();
}

function renderTraceLogs() {
  const container = document.getElementById("agent-trace-logs");
  const fullActivityFeed = document.getElementById("full-activity-stream");

  const filtered = activeFilter === 'ALL' 
    ? activityLogs 
    : activityLogs.filter(l => l.category === activeFilter);

  const html = filtered.map(l => {
    let catClass = "text-cyan-400 border-cyan-500/30 bg-cyan-950/40";
    if (l.category === "SEVERITY") catClass = "text-amber-400 border-amber-500/30 bg-amber-950/40";
    if (l.category === "ROUTING") catClass = "text-blue-400 border-blue-500/30 bg-blue-950/40";
    if (l.category === "ACTION") catClass = "text-purple-400 border-purple-500/30 bg-purple-950/40";
    if (l.category === "MONITORING") catClass = "text-emerald-400 border-emerald-500/30 bg-emerald-950/40";
    if (l.category === "RESOLVED") catClass = "text-emerald-300 border-emerald-400 bg-emerald-950/60";
    if (l.category === "ESCALATION") catClass = "text-rose-400 border-rose-500/30 bg-rose-950/60";

    return `
      <div class="flex items-start gap-3 py-2 px-2.5 rounded-lg hover:bg-slate-800/40 transition-colors font-mono-code text-xs">
        <span class="text-slate-500 shrink-0 font-medium">${l.time}</span>
        <span class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border shrink-0 ${catClass}">
          ${l.category}
        </span>
        <span class="text-slate-300 font-medium shrink-0">${l.agent}:</span>
        <span class="text-slate-400 leading-snug flex-1">${l.msg}</span>
      </div>
    `;
  }).join("");

  if (container) container.innerHTML = html || `<p class="text-xs text-slate-500 p-3">No matching logs found.</p>`;
  if (fullActivityFeed) fullActivityFeed.innerHTML = html || `<p class="text-xs text-slate-500 p-3">No activity logs recorded yet.</p>`;
}

window.filterTrace = function(category) {
  activeFilter = category;
  document.querySelectorAll(".trace-filter-btn").forEach(btn => {
    if (btn.dataset.category === category) {
      btn.className = "trace-filter-btn px-2.5 py-1 text-xs rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-medium transition-all";
    } else {
      btn.className = "trace-filter-btn px-2.5 py-1 text-xs rounded-md bg-slate-800/80 text-slate-400 border border-slate-700 hover:border-slate-600 transition-all";
    }
  });
  renderTraceLogs();
};

window.exportTraceJSON = function() {
  const jsonStr = JSON.stringify(activityLogs, null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    showToast("Trace Copied", "Agent audit trace copied to clipboard as JSON.");
  });
};

// ==========================================
// 11. My Complaints Tab
// ==========================================
function renderMyComplaints() {
  const container = document.getElementById("my-complaints-list");
  if (!container) return;

  container.innerHTML = myComplaintsList.map(c => {
    let sevBadge = "bg-blue-500/20 text-blue-300 border-blue-500/40";
    if (c.severity === "HIGH") sevBadge = "bg-amber-500/20 text-amber-300 border-amber-500/40";
    if (c.severity === "CRITICAL") sevBadge = "bg-rose-500/20 text-rose-300 border-rose-500/40";

    let statBadge = "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    if (c.status === "RESOLVED") statBadge = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    if (c.status === "REOPENED") statBadge = "bg-rose-500/20 text-rose-300 border-rose-500/40";

    return `
      <div class="glass-panel p-4 rounded-xl border border-slate-700/60 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1.5 flex-1">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="font-mono-code font-bold text-cyan-400 text-sm">${c.id}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${statBadge}">${c.status}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${sevBadge}">${c.severity} SEVERITY</span>
            <span class="text-xs text-slate-400 flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${c.timestamp}</span>
          </div>
          <h4 class="font-semibold text-slate-100 text-base">${c.issue}</h4>
          <p class="text-xs text-slate-400 flex items-center gap-1.5">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-slate-400"></i> ${c.location}
          </p>
          <div class="flex items-center gap-3 text-xs text-slate-400 pt-1">
            <span>Dept: <strong class="text-slate-300 font-medium">${c.dept}</strong></span>
            <span>•</span>
            <span>Priority: <strong class="text-cyan-300 font-medium">${c.priority}</strong></span>
            <span>•</span>
            <span>SLA: <strong class="text-emerald-400 font-medium">${c.sla}</strong></span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="viewComplaintDetails('${c.id}')" class="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i> Inspect Loop
          </button>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) window.lucide.createIcons();
}

window.viewComplaintDetails = function(cid) {
  const item = myComplaintsList.find(x => x.id === cid);
  if (!item) return;

  // Set as current and switch to main report view to see details
  currentComplaint = {
    id: item.id,
    issue: item.issue,
    confidence: "95%",
    severity: item.severity,
    priority: item.priority,
    department: item.dept,
    location: item.location,
    duplicateInfo: "No matching duplicate in sector",
    status: item.status,
    slaHours: 48,
    repairProof: DEMO_PRESETS.pothole.repairProof,
    currentStep: item.activeStep || 5
  };

  switchTab('citizen-report');
  renderStructuredComplaintCard(currentComplaint);
  renderTrackingTimeline(currentComplaint.currentStep);
};

// ==========================================
// 12. Helper Utilities
// ==========================================
function getTimestamp() {
  const now = new Date();
  return now.toTimeString().split(" ")[0];
}

function showToast(arg1, arg2 = "") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const validTypes = ["success", "info", "error", "warning"];
  const isSecondParamType = typeof arg2 === "string" && validTypes.includes(arg2.toLowerCase());

  const type = isSecondParamType ? arg2.toLowerCase() : "info";
  const title = isSecondParamType 
    ? (type === "success" ? "Success" : type === "error" ? "Action Required" : "System Update")
    : arg1;
  const message = isSecondParamType ? arg1 : (arg2 || arg1);

  let iconName = "info";
  let borderClass = "border-cyan-500/40";
  let badgeColor = "bg-cyan-500/20 text-cyan-300";

  if (type === "success" || title.toLowerCase().includes("success") || title.toLowerCase().includes("resolved")) {
    iconName = "check-circle";
    borderClass = "border-emerald-500/50";
    badgeColor = "bg-emerald-500/20 text-emerald-300";
  } else if (type === "error" || title.toLowerCase().includes("error") || title.toLowerCase().includes("reopened") || title.toLowerCase().includes("required")) {
    iconName = "alert-circle";
    borderClass = "border-rose-500/50";
    badgeColor = "bg-rose-500/20 text-rose-300";
  }

  const toast = document.createElement("div");
  toast.className = `glass-panel-glow p-3.5 rounded-xl border ${borderClass} text-xs shadow-2xl flex items-start gap-3 transition-all duration-300 transform translate-y-2 opacity-0 z-50`;
  toast.innerHTML = `
    <div class="w-6 h-6 rounded-full ${badgeColor} flex items-center justify-center shrink-0">
      <i data-lucide="${iconName}" class="w-3.5 h-3.5"></i>
    </div>
    <div class="flex-1 min-w-0">
      <h5 class="font-bold text-slate-100">${title}</h5>
      <p class="text-slate-300 mt-0.5 leading-snug">${message}</p>
    </div>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("translate-y-2", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
