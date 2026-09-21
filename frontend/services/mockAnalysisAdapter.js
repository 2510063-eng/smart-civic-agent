/**
 * Mock Analysis Adapter — Milestone 1
 * 
 * Maps raw mock responses to the standardized frontend AnalysisResult domain model.
 * Decouples the UI from the raw transport payload structure.
 * 
 * TODO [PIYUSH INTEGRATION]:
 * When Piyush finalizes the real Backend API contract:
 * 1. Create `realAnalysisAdapter.js` implementing the same `adapt(rawResponse)` interface.
 * 2. Map Piyush's official response fields (e.g. `issue_type`, `severity_score`, `evidence`) into `AnalysisResult`.
 * 3. Swap the adapter injection in `analysisService.js`.
 */

export class MockAnalysisAdapter {
  /**
   * Adapts the raw mock payload into the frontend AnalysisResult domain structure
   * @param {Object} rawPayload - Raw response from mock source
   * @returns {import('../../types/index.ts').AnalysisResult}
   */
  adapt(rawPayload) {
    const meta = rawPayload?.__dev_meta || {};
    const result = rawPayload?.simulation_result || {};

    return {
      isMock: true,
      status: 'ANALYZED',
      issueType: result.issue_type || "Road Surface Hazard (Sample Mock)",
      category: result.category || "Roads & Pavement",
      severity: result.severity || "High",
      reason: result.reason || "Simulated pavement defect pattern match.",
      department: result.department || "Municipal Roads & Public Works",
      assignedUnit: result.assigned_unit || "Rapid Pavement Squad #4",
      evidenceStatus: result.evidence_status || "Verified Image Intake (Simulated)",
      estimatedResolutionHours: result.estimated_resolution_hours || 4,
      confidenceScore: typeof result.confidence === 'number' ? result.confidence : 0.94,
      summaryNotes: result.preliminary_notes || "Mock analysis summary for UI verification.",
      perceivedElements: Array.isArray(result.visual_features_found) 
        ? [...result.visual_features_found] 
        : ["Sample visual element (Mock)"],
      disclaimer: meta.disclaimer || "DEVELOPMENT MOCK DATA ONLY — Real AI agent is not yet integrated.",
      analyzedAt: result.simulated_at || new Date().toISOString()
    };
  }
}
