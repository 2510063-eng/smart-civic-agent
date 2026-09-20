/**
 * CivicResolve AI — Dashboard Configuration
 * Supports Standalone Mock Mode and Live Backend API Mode (docs/API_CONTRACT.md)
 */

const CONFIG = {
  APP_NAME: "CivicResolve AI",
  SUBTITLE: "Smart Civic Issues Resolution & Verification Dashboard",
  VERSION: "1.0.0-hackathon",
  DEFAULT_API_BASE_URL: "http://localhost:8000",
  DEFAULT_CENTER_COORDS: [16.7050, 74.2433], // Municipal Area (Kolhapur/Demo City)
  DEFAULT_ZOOM: 13,

  // Storage Keys
  STORAGE_KEYS: {
    MODE: "civicresolve_data_mode", // "mock" or "api"
    API_URL: "civicresolve_api_url",
    COMPLAINTS: "civicresolve_complaints_v1",
    WORKERS: "civicresolve_workers_v1",
    DEPARTMENTS: "civicresolve_departments_v1",
    AGENT_ACTIONS: "civicresolve_agent_actions_v1",
    NOTIFICATIONS: "civicresolve_notifications_v1",
    SETTINGS: "civicresolve_settings_v1"
  },

  // Standard Department Mapping
  DEPARTMENTS: {
    ROAD_DEPARTMENT: {
      code: "ROAD_DEPARTMENT",
      name: "Roads & Infrastructure",
      color: "amber",
      icon: "truck",
      slaHours: { CRITICAL: 4, HIGH: 12, MEDIUM: 24, LOW: 48 }
    },
    SANITATION_DEPARTMENT: {
      code: "SANITATION_DEPARTMENT",
      name: "Public Sanitation & Waste",
      color: "emerald",
      icon: "trash-2",
      slaHours: { CRITICAL: 6, HIGH: 16, MEDIUM: 24, LOW: 72 }
    },
    WATER_SUPPLY_SEWERAGE: {
      code: "WATER_SUPPLY_SEWERAGE",
      name: "Water Supply & Sewerage",
      color: "sky",
      icon: "droplet",
      slaHours: { CRITICAL: 3, HIGH: 8, MEDIUM: 20, LOW: 48 }
    },
    ELECTRICITY_BOARD: {
      code: "ELECTRICITY_BOARD",
      name: "Street Lighting & Electricity",
      color: "yellow",
      icon: "zap",
      slaHours: { CRITICAL: 4, HIGH: 12, MEDIUM: 24, LOW: 48 }
    },
    DRAINAGE_WORKS: {
      code: "DRAINAGE_WORKS",
      name: "Drainage & Stormwater",
      color: "indigo",
      icon: "waves",
      slaHours: { CRITICAL: 4, HIGH: 12, MEDIUM: 24, LOW: 48 }
    },
    TRAFFIC_POLICE: {
      code: "TRAFFIC_POLICE",
      name: "Traffic & Transit Enforcement",
      color: "purple",
      icon: "shield-alert",
      slaHours: { CRITICAL: 2, HIGH: 6, MEDIUM: 18, LOW: 36 }
    }
  },

  // Priority metadata
  PRIORITIES: {
    CRITICAL: { label: "Critical", badgeClass: "bg-red-500/15 text-red-500 border-red-500/30", color: "#ef4444", slaMultiplier: 0.5 },
    HIGH: { label: "High", badgeClass: "bg-orange-500/15 text-orange-500 border-orange-500/30", color: "#f97316", slaMultiplier: 1.0 },
    MEDIUM: { label: "Medium", badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30", color: "#f59e0b", slaMultiplier: 1.5 },
    LOW: { label: "Low", badgeClass: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", color: "#10b981", slaMultiplier: 2.0 }
  },

  // Complaint lifecycle statuses
  STATUSES: {
    NEW: { label: "New", class: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
    ANALYZING: { label: "AI Analyzing", class: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
    ASSIGNED: { label: "Assigned", class: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    IN_PROGRESS: { label: "In Progress", class: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
    SLA_BREACH: { label: "SLA Breached", class: "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse" },
    FOLLOW_UP: { label: "Follow Up", class: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    ESCALATED: { label: "Escalated", class: "bg-red-600/25 text-red-400 border-red-500/40" },
    RESOLVED: { label: "Resolved", class: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
    VERIFICATION: { label: "Verification Required", class: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40" },
    CLOSED: { label: "Closed", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    REOPENED: { label: "Reopened", class: "bg-orange-500/20 text-orange-400 border-orange-500/40" }
  },

  // API Endpoints matching docs/API_CONTRACT.md
  ENDPOINTS: {
    HEALTH: "/health",
    COMPLAINTS: "/api/complaints",
    COMPLAINT_DETAIL: (id) => `/api/complaints/${id}`,
    ASSIGN_WORKER: (id) => `/api/complaints/${id}/assign`,
    UPDATE_STATUS: (id) => `/api/complaints/${id}/status`,
    AGENT_ACTIONS: (id) => `/api/complaints/${id}/actions`,
    VERIFY_RESOLUTION: (id) => `/api/complaints/${id}/verify`,
    FOLLOW_UP: (id) => `/api/complaints/${id}/followup`,
    ESCALATE: (id) => `/api/complaints/${id}/escalate`,
    ANALYTICS: "/api/analytics",
    WORKERS: "/api/workers",
    DEPARTMENTS: "/api/departments"
  }
};

window.CONFIG = CONFIG;
