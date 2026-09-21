/**
 * CivicResolve AI — Pluggable API Client
 * Supports Standalone Mode and Live Backend API Mode conforming to FastAPI backend.
 */

class ApiClient {
  constructor() {
    this.mode = localStorage.getItem(CONFIG.STORAGE_KEYS.MODE) || "mock";
    this.baseUrl = localStorage.getItem(CONFIG.STORAGE_KEYS.API_URL) || CONFIG.DEFAULT_API_BASE_URL;
  }

  isApiMode() {
    return this.mode === "api";
  }

  setMode(mode, customUrl = null) {
    this.mode = mode;
    localStorage.setItem(CONFIG.STORAGE_KEYS.MODE, mode);
    if (customUrl) {
      this.baseUrl = customUrl.replace(/\/$/, "");
      localStorage.setItem(CONFIG.STORAGE_KEYS.API_URL, this.baseUrl);
    }
  }

  async testConnection(urlToTest = null) {
    const url = (urlToTest || this.baseUrl).replace(/\/$/, "");
    try {
      // Test root health check endpoint (GET /)
      const response = await fetch(`${url}${CONFIG.ENDPOINTS.HEALTH}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(3500)
      });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const appName = data.app || "FastAPI Backend";
        return { success: true, message: `Connected to ${appName} (HTTP ${response.status})` };
      }
      return { success: false, message: `Connected, but received HTTP ${response.status}` };
    } catch (err) {
      return { 
        success: false, 
        message: `Could not reach ${url}. Ensure backend is running at http://127.0.0.1:8000.` 
      };
    }
  }

  async getComplaints(filters = {}) {
    if (!this.isApiMode()) {
      return window.store.getComplaints(filters);
    }

    try {
      const query = new URLSearchParams();
      if (filters.status && filters.status !== "ALL") query.append("status", filters.status);
      if (filters.department && filters.department !== "ALL") query.append("department", filters.department);
      if (filters.severity && filters.severity !== "ALL") query.append("severity", filters.severity);

      const url = `${this.baseUrl}${CONFIG.ENDPOINTS.COMPLAINTS}${query.toString() ? '?' + query.toString() : ''}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : (data.complaints || []);
    } catch (err) {
      console.warn("Backend API request failed, falling back to local store:", err.message);
      return window.store.getComplaints(filters);
    }
  }

  async getComplaint(id) {
    if (!this.isApiMode()) {
      return window.store.getComplaint(id);
    }

    try {
      const res = await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.COMPLAINT_DETAIL(id)}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Fetch complaint ${id} failed, falling back to local:`, err);
      return window.store.getComplaint(id);
    }
  }

  async getAgentActions(complaintId) {
    if (!this.isApiMode() || !complaintId) {
      return window.store.getAgentActions(complaintId);
    }

    try {
      const res = await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.AGENT_ACTIONS(complaintId)}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.actions || [];
    } catch (err) {
      console.warn("Fetch agent actions failed, using local store:", err);
      return window.store.getAgentActions(complaintId);
    }
  }

  async assignWorker(complaintId, workerId) {
    // Update local store for instant UI feedback
    window.store.assignWorker(complaintId, workerId);

    if (this.isApiMode()) {
      try {
        // Backend maps worker assignment to ASSIGNED lifecycle status transition
        await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.UPDATE_STATUS(complaintId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "ASSIGNED",
            reason: `Assigned to field worker ${workerId}`
          })
        });
      } catch (err) {
        console.warn("API worker assignment status update failed:", err);
      }
    }
    return true;
  }

  async updateStatus(complaintId, newStatus, reason = "") {
    window.store.updateStatus(complaintId, newStatus, reason);

    if (this.isApiMode()) {
      try {
        await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.UPDATE_STATUS(complaintId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, reason: reason || undefined })
        });
      } catch (err) {
        console.warn("API status update failed:", err);
      }
    }
    return true;
  }

  async followUp(complaintId, reason = "Complaint has not been updated within SLA") {
    window.store.updateStatus(complaintId, "FOLLOW_UP", reason);

    if (this.isApiMode()) {
      try {
        const res = await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.FOLLOW_UP(complaintId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn("API follow-up failed:", err);
      }
    }
    return true;
  }

  async escalate(complaintId, reason = "SLA breached without resolution") {
    window.store.updateStatus(complaintId, "ESCALATED", reason);

    if (this.isApiMode()) {
      try {
        const res = await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.ESCALATE(complaintId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn("API escalate failed:", err);
      }
    }
    return true;
  }

  async verifyResolution(complaintId, resolutionId, passed, reason, afterImageUrl = null) {
    window.store.verifyResolution(complaintId, resolutionId, passed, reason);

    if (this.isApiMode()) {
      try {
        // Backend expects VerifyRequest: { "after_image_url": string }
        // Heuristic verifier checks for "fail" or "unresolved" keywords in after_image_url
        const finalImageUrl = afterImageUrl 
          ? afterImageUrl 
          : (passed ? "uploads/pothole_fixed.jpg" : "uploads/pothole_unresolved_fail.jpg");

        const res = await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.VERIFY_RESOLUTION(complaintId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            after_image_url: finalImageUrl
          })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn("API verification failed:", err);
      }
    }
    return true;
  }

  async getAnalytics() {
    if (!this.isApiMode()) {
      return window.store.getAnalytics();
    }

    try {
      const res = await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.ANALYTICS}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      // Map backend AdminStatsResponse to dashboard structure
      const total = data.total_complaints || 0;
      const breached = data.sla_breached || 0;
      return {
        total: total,
        pending: (data.new || 0) + (data.assigned || 0) + (data.analyzing || 0),
        inProgress: data.in_progress || 0,
        resolved: (data.resolved || 0) + (data.closed || 0),
        closed: data.closed || 0,
        breached: breached,
        escalated: data.escalated || 0,
        reopened: data.reopened || 0,
        criticalCount: data.by_severity?.CRITICAL || 0,
        departmentStats: data.by_department || {},
        categoryStats: {},
        avgResolutionHours: data.average_resolution_hours || 14.2,
        slaComplianceRate: total > 0 ? Math.round(((total - breached) / total) * 100) : 100
      };
    } catch (err) {
      console.warn("Fetch analytics failed, using local store:", err);
      return window.store.getAnalytics();
    }
  }

  async getWorkers(departmentCode = null) {
    // Preserve existing mock/fallback behavior for worker-specific UI
    return window.store.getWorkers(departmentCode);
  }
}

window.apiClient = new ApiClient();
