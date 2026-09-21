/**
 * Citizen Complaint Store & Local Tracking Service
 * Manages submitted citizen complaints in local storage with simulated workflow updates.
 * Owner: Samyak (Citizen Frontend)
 */

const STORAGE_KEY = 'civicresolve_citizen_complaints';

// Initial pre-seeded complaint so citizen can immediately test "Track My Complaint"
const INITIAL_SAMPLE_COMPLAINTS = [
  {
    complaintId: "CR-2026-8491",
    title: "Hazardous Open Pothole at Linking Road Junction",
    category: "Roads & Pavement",
    severity: "High",
    department: "Municipal Roads & Public Works",
    assignedUnit: "Rapid Pavement Squad #4",
    location: {
      addressText: "Linking Road, near National College Metro Pillar 42, Ward 12",
      landmark: "National College Metro Pillar 42",
      ward: "Ward 12 (West)"
    },
    description: "Substantial crater pothole measuring approx 45cm across in middle vehicular lane. Poses serious fall hazard to two-wheelers and pedestrians at night.",
    evidenceName: "pothole_evidence_sample.jpg",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: "IN_PROGRESS",
    statusText: "Crew Dispatched on Site",
    eta: "Today, within 4 hours",
    steps: [
      {
        label: "AI Triage & Classification",
        description: "Vision model identified Road Hazard (94% confidence). Routing determined.",
        timestamp: new Date(Date.now() - 3600000 * 5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completed: true,
        current: false
      },
      {
        label: "Municipal Department Acknowledged",
        description: "Public Works intake officer confirmed SLA priority (High).",
        timestamp: new Date(Date.now() - 3600000 * 3.5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completed: true,
        current: false
      },
      {
        label: "Field Unit Assigned",
        description: "Assigned to Rapid Pavement Squad #4 (Operative: R. Deshmukh).",
        timestamp: new Date(Date.now() - 3600000 * 1.5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completed: true,
        current: false
      },
      {
        label: "On-Site Repair in Progress",
        description: "Cold-mix asphalt patch application underway. Photographic verification pending.",
        timestamp: new Date(Date.now() - 3600000 * 0.5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completed: false,
        current: true
      },
      {
        label: "Autonomous Verification & Closure",
        description: "Citizen verification & computer-vision post-repair confirmation.",
        timestamp: null,
        completed: false,
        current: false
      }
    ]
  }
];

export class ComplaintStore {
  constructor() {
    this.initStore();
  }

  initStore() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_COMPLAINTS));
      }
    } catch (e) {
      console.warn("Local storage not accessible; using memory store fallback.", e);
    }
  }

  getAllComplaints() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // fallback
    }
    return [...INITIAL_SAMPLE_COMPLAINTS];
  }

  getComplaintById(complaintId) {
    if (!complaintId) return null;
    const cleanId = complaintId.trim().toUpperCase();
    const list = this.getAllComplaints();
    return list.find(c => c.complaintId.toUpperCase() === cleanId) || null;
  }

  saveComplaint(complaint) {
    const list = this.getAllComplaints();
    // Prepend new complaint
    const updated = [complaint, ...list.filter(c => c.complaintId !== complaint.complaintId)];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to persist complaint to local storage", e);
    }
    return complaint;
  }

  generateId() {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `CR-${year}-${randomSuffix}`;
  }
}

export const complaintStore = new ComplaintStore();
