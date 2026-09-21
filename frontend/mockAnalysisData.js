/**
 * Mock Analysis Data for Frontend Development (Milestone 1)
 * 
 * IMPORTANT:
 * - This mock data exists ONLY for frontend UI layout and flow testing.
 * - This is NOT output from the real AI agent or Piyush's backend.
 * - Do NOT modify this file expecting backend logic changes.
 */

export const MOCK_ANALYSIS_RAW_PAYLOAD = {
  __dev_meta: {
    is_mock: true,
    source: "Frontend Mock Data Generator (Milestone 1 Dev Stub)",
    ai_agent_connected: false,
    backend_connected: false,
    disclaimer: "DEVELOPMENT MOCK DATA ONLY — This is a simulated result for frontend testing. It is NOT real AI analysis or municipal data."
  },
  simulation_result: {
    issue_type: "Road Surface Hazard (Pothole / Crater)",
    severity: "High",
    reason: "Simulated visual pattern analysis identified pavement deformation > 12cm in active vehicular lane.",
    department: "Municipal Roads & Public Works",
    evidence_status: "Photo Evidence Verified (Simulated)",
    confidence: 0.94,
    visual_features_found: [
      "Image integrity verified (Format valid)",
      "High-contrast surface variance identified (Mock)",
      "Roadway boundary markers detected (Mock)",
      "Location coordinates approximate zone mapped (Mock)"
    ],
    preliminary_notes: "Sample perception generated for UI validation of the review screen. Field operatives and real AI models are not active in this development build.",
    simulated_at: new Date().toISOString()
  }
};
