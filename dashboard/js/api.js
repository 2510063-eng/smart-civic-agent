/**
 * CivicResolve AI — Pluggable API Client
 * Supports Standalone Mode and Live Backend API Mode conforming to docs/API_CONTRACT.md.
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
      const response = await fetch(`${url}/api/complaints`, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(3500)
      });
      if (response.ok) {
        return { success: true, message: `Connected successfully to ${url} (HTTP ${response.status})` };
      }
      return { success: false, message: `Connected, but received HTTP ${response.status}` };
    } catch (err) {
      return { 
        success: false, 
        message: `Could not reach ${url}. Ensure the backend server is running.` 
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

  async assignWorker(complaintId, workerId) {
    // Always update local store for instant UI feedback
    window.store.assignWorker(complaintId, workerId);

    if (this.isApiMode()) {
      try {
        await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.ASSIGN_WORKER(complaintId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ worker_id: workerId })
        });
      } catch (err) {
        console.warn("API worker assignment failed:", err);
      }
    }
    return true;
  }

  async updateStatus(complaintId, newStatus, reason = "") {
    window.store.updateStatus(complaintId, newStatus, reason);

    if (this.isApiMode()) {
      try {
        await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.UPDATE_STATUS(complaintId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, reason })
        });
      } catch (err) {
        console.warn("API status update failed:", err);
      }
    }
    return true;
  }

  async verifyResolution(complaintId, resolutionId, passed, reason) {
    window.store.verifyResolution(complaintId, resolutionId, passed, reason);

    if (this.isApiMode()) {
      try {
        await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.VERIFY_RESOLUTION(complaintId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resolution_id: resolutionId,
            verification_status: passed ? "PASSED" : "FAILED",
            verification_reason: reason
          })
        });
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
      return await res.json();
    } catch (err) {
      console.warn("Fetch analytics failed, using local store:", err);
      return window.store.getAnalytics();
    }
  }

  async getWorkers(departmentCode = null) {
    if (!this.isApiMode()) {
      return window.store.getWorkers(departmentCode);
    }

    try {
      const res = await fetch(`${this.baseUrl}${CONFIG.ENDPOINTS.WORKERS}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : (data.workers || []);
    } catch (err) {
      return window.store.getWorkers(departmentCode);
    }
  }
}

window.apiClient = new ApiClient();
