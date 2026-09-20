/**
 * CivicResolve AI — Local Reactive State Store & Persistence
 * Manages complaints, workers, AI agent action logs, and analytics.
 */

class DashboardStore {
  constructor() {
    this.listeners = [];
    this.init();
  }

  init() {
    const storedComplaints = localStorage.getItem(CONFIG.STORAGE_KEYS.COMPLAINTS);
    if (!storedComplaints) {
      this.resetToSeedData();
    } else {
      try {
        this.complaints = JSON.parse(storedComplaints);
        this.workers = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.WORKERS)) || SEED_DATA.workers;
        this.agentActions = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.AGENT_ACTIONS)) || SEED_DATA.agentActions;
      } catch (e) {
        console.error("Failed to parse stored data, resetting to seed data", e);
        this.resetToSeedData();
      }
    }
  }

  resetToSeedData() {
    this.complaints = JSON.parse(JSON.stringify(SEED_DATA.complaints));
    this.workers = JSON.parse(JSON.stringify(SEED_DATA.workers));
    this.agentActions = JSON.parse(JSON.stringify(SEED_DATA.agentActions));
    this.save();
    this.notify();
  }

  save() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.COMPLAINTS, JSON.stringify(this.complaints));
      localStorage.setItem(CONFIG.STORAGE_KEYS.WORKERS, JSON.stringify(this.workers));
      localStorage.setItem(CONFIG.STORAGE_KEYS.AGENT_ACTIONS, JSON.stringify(this.agentActions));
    } catch (e) {
      console.warn("Storage quota or access issue saving state", e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => {
      try { fn(this); } catch (e) { console.error("Store listener error:", e); }
    });
  }

  // --- Complaint Operations ---

  getComplaints(filters = {}) {
    let list = [...this.complaints];

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(c => 
        c.complaint_id.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.location_text && c.location_text.toLowerCase().includes(q)) ||
        (c.citizen_name && c.citizen_name.toLowerCase().includes(q)) ||
        (c.issue_type && c.issue_type.toLowerCase().includes(q))
      );
    }

    if (filters.status && filters.status !== "ALL") {
      list = list.filter(c => c.status === filters.status);
    }

    if (filters.severity && filters.severity !== "ALL") {
      list = list.filter(c => c.severity === filters.severity);
    }

    if (filters.department && filters.department !== "ALL") {
      list = list.filter(c => c.department === filters.department);
    }

    if (filters.slaStatus === "BREACHED") {
      const now = new Date().toISOString();
      list = list.filter(c => 
        (c.status !== "CLOSED" && c.status !== "RESOLVED") && 
        (c.status === "SLA_BREACH" || (c.sla_deadline && c.sla_deadline < now))
      );
    }

    // Sorting
    if (filters.sortBy === "severity") {
      list.sort((a, b) => (b.severity_score || 0) - (a.severity_score || 0));
    } else if (filters.sortBy === "sla") {
      list.sort((a, b) => new Date(a.sla_deadline || 0) - new Date(b.sla_deadline || 0));
    } else {
      // Default newest first
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return list;
  }

  getComplaint(complaintId) {
    return this.complaints.find(c => c.complaint_id === complaintId);
  }

  addComplaint(data) {
    const newId = `CMP${String(this.complaints.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    
    // Auto calculate SLA deadline
    const hours = data.severity === "CRITICAL" ? 4 : data.severity === "HIGH" ? 12 : data.severity === "MEDIUM" ? 24 : 48;
    const deadline = new Date(Date.now() + hours * 3600 * 1000).toISOString();

    const complaint = {
      complaint_id: newId,
      citizen_id: data.citizen_id || "CIT_PORTAL",
      citizen_name: data.citizen_name || "Citizen Reporter",
      citizen_phone: data.citizen_phone || "+91 99000 00000",
      description: data.description,
      image_url: data.image_url || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
      voice_url: data.voice_url || null,
      latitude: data.latitude || 16.7050,
      longitude: data.longitude || 74.2433,
      location_text: data.location_text || "Central Municipal Area",
      issue_type: data.issue_type || "POTHOLE",
      severity: data.severity || "MEDIUM",
      severity_score: data.severity_score || 0.65,
      department: data.department || "ROAD_DEPARTMENT",
      confidence: data.confidence || 0.90,
      reason: data.reason || "Autonomous agent classified civic issue report.",
      evidence: data.evidence || ["Visual road defect detected", "Reported by citizen with GPS location"],
      status: "NEW",
      assigned_worker_id: null,
      duplicate_of: data.duplicate_of || null,
      similarity_score: data.similarity_score || 0,
      created_at: now,
      updated_at: now,
      sla_deadline: deadline,
      resolved_at: null,
      closed_at: null,
      resolutions: []
    };

    this.complaints.unshift(complaint);

    // Add agent actions
    this.addAgentAction(newId, "PERCEIVE_EVIDENCE", "Citizen reported civic issue with photo evidence & coordinates", "Issue ingested successfully");
    this.addAgentAction(newId, "CLASSIFY_ISSUE", `Classified as ${complaint.issue_type}`, `Assigned severity ${complaint.severity} (${complaint.severity_score})`);
    this.addAgentAction(newId, "ASSIGN_DEPARTMENT", `Determined responsible municipal agency`, `Routed to ${complaint.department}`);

    this.save();
    this.notify();
    return complaint;
  }

  updateComplaint(complaintId, updates) {
    const idx = this.complaints.findIndex(c => c.complaint_id === complaintId);
    if (idx === -1) return null;

    this.complaints[idx] = {
      ...this.complaints[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.save();
    this.notify();
    return this.complaints[idx];
  }

  assignWorker(complaintId, workerId) {
    const worker = this.workers.find(w => w.id === workerId);
    if (!worker) return false;

    this.updateComplaint(complaintId, {
      assigned_worker_id: workerId,
      status: "ASSIGNED"
    });

    // Update worker task count
    worker.activeTasks = (worker.activeTasks || 0) + 1;
    worker.status = "BUSY";

    this.addAgentAction(
      complaintId,
      "ASSIGN_WORKER",
      `Dispatched task to ${worker.department} field operative`,
      `Assigned to ${worker.name} (${worker.id})`
    );

    this.save();
    this.notify();
    return true;
  }

  updateStatus(complaintId, newStatus, reason = "Status updated via command console") {
    const complaint = this.getComplaint(complaintId);
    if (!complaint) return false;

    const updates = { status: newStatus };
    if (newStatus === "RESOLVED") {
      updates.resolved_at = new Date().toISOString();
    } else if (newStatus === "CLOSED") {
      updates.closed_at = new Date().toISOString();
    }

    this.updateComplaint(complaintId, updates);
    this.addAgentAction(complaintId, "UPDATE_STATUS", reason, `Transitioned status to ${newStatus}`);
    return true;
  }

  // --- Resolution Verification Workflow ---

  verifyResolution(complaintId, resolutionId, passed, reason) {
    const complaint = this.getComplaint(complaintId);
    if (!complaint) return false;

    const resIdx = (complaint.resolutions || []).findIndex(r => r.resolution_id === resolutionId);
    if (resIdx !== -1) {
      complaint.resolutions[resIdx].verification_status = passed ? "PASSED" : "FAILED";
      complaint.resolutions[resIdx].verification_confidence = passed ? 0.94 : 0.88;
      complaint.resolutions[resIdx].verification_reason = reason;
    }

    if (passed) {
      complaint.status = "CLOSED";
      complaint.closed_at = new Date().toISOString();
      this.addAgentAction(
        complaintId,
        "VERIFY_RESOLUTION",
        "Autonomous visual verification of before & after repair imagery: SUCCESS",
        `Resolution APPROVED. Complaint marked CLOSED. Reason: ${reason}`
      );
    } else {
      complaint.status = "REOPENED";
      this.addAgentAction(
        complaintId,
        "VERIFY_RESOLUTION",
        "Autonomous visual verification detected persistent defect: REJECTED",
        `Resolution REJECTED. Complaint REOPENED with escalation flag. Reason: ${reason}`
      );
      this.addAgentAction(
        complaintId,
        "ESCALATE",
        "Verification failure indicates incomplete field resolution",
        "Re-routed to supervisor queue with priority elevation."
      );
    }

    this.updateComplaint(complaintId, complaint);
    return true;
  }

  // --- Worker & Agent Action Operations ---

  getWorkers(departmentCode = null) {
    if (!departmentCode || departmentCode === "ALL") return this.workers;
    return this.workers.filter(w => w.department === departmentCode);
  }

  getAgentActions(complaintId = null) {
    if (complaintId) {
      return this.agentActions.filter(a => a.complaint_id === complaintId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    return [...this.agentActions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  addAgentAction(complaintId, action, reason, result) {
    const actionId = `ACT${String(this.agentActions.length + 1).padStart(3, '0')}`;
    const entry = {
      action_id: actionId,
      complaint_id: complaintId,
      agent: "CivicResolutionAgent",
      action: action,
      reason: reason,
      result: result,
      timestamp: new Date().toISOString()
    };
    this.agentActions.unshift(entry);
    this.save();
    return entry;
  }

  // --- Analytics Aggregation ---

  getAnalytics() {
    const now = new Date().toISOString();
    const total = this.complaints.length;
    let pending = 0;
    let inProgress = 0;
    let resolved = 0;
    let closed = 0;
    let breached = 0;
    let escalated = 0;
    let reopened = 0;
    let criticalCount = 0;

    const deptCounts = {};
    const categoryCounts = {};

    this.complaints.forEach(c => {
      if (c.status === "NEW" || c.status === "ASSIGNED" || c.status === "ANALYZING") pending++;
      if (c.status === "IN_PROGRESS") inProgress++;
      if (c.status === "RESOLVED" || c.status === "VERIFICATION") resolved++;
      if (c.status === "CLOSED") closed++;
      if (c.status === "ESCALATED") escalated++;
      if (c.status === "REOPENED") reopened++;
      if (c.severity === "CRITICAL") criticalCount++;

      // Check SLA breach
      if (c.status !== "CLOSED" && c.status !== "RESOLVED") {
        if (c.status === "SLA_BREACH" || (c.sla_deadline && c.sla_deadline < now)) {
          breached++;
        }
      }

      // Department distribution
      const dept = c.department || "UNASSIGNED";
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;

      // Category distribution
      const cat = c.issue_type || "OTHER";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return {
      total,
      pending,
      inProgress,
      resolved: resolved + closed,
      closed,
      breached,
      escalated,
      reopened,
      criticalCount,
      departmentStats: deptCounts,
      categoryStats: categoryCounts,
      avgResolutionHours: 14.2,
      slaComplianceRate: total > 0 ? Math.round(((total - breached) / total) * 100) : 100
    };
  }
}

window.store = new DashboardStore();
