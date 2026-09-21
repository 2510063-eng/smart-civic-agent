/**
 * Frontend Analysis Service — Milestone 1
 * Owner: Samyak (Citizen Frontend)
 * 
 * Provides an isolated analysis service API for the UI layer.
 * 
 * Architecture:
 * UI Components -> AnalysisService -> AnalysisAdapter -> Mock Transport Source
 * 
 * ----------------------------------------------------------------------------
 * TODO [PIYUSH BACKEND INTEGRATION NOTE]:
 * Once Piyush's backend API contract is finalized:
 * 1. Introduce a RealHttpTransport or fetch call inside an updated/real service implementation.
 * 2. Point to the finalized backend endpoint (without hardcoding URLs in the UI).
 * 3. Replace `mockAdapter.adapt()` with the finalized API adapter.
 * 4. Keep this mock service for offline and isolated frontend development testing.
 * ----------------------------------------------------------------------------
 */

import { MockAnalysisAdapter } from './adapters/mockAnalysisAdapter.js';
import { MOCK_ANALYSIS_RAW_PAYLOAD } from './mocks/mockAnalysisData.js';

export class AnalysisService {
  constructor(adapter = new MockAnalysisAdapter()) {
    this.adapter = adapter;
  }

  /**
   * Analyzes a citizen report.
   * In Milestone 1, this delegates exclusively to the isolated mock adapter.
   * 
   * @param {import('../types/index.ts').CitizenReport} report 
   * @returns {Promise<import('../types/index.ts').AnalysisResult>}
   */
  async analyzeReport(report) {
    // Artificial slight latency to realistically test UI loading states and button disabling
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Pass through mock adapter
    // Inject contextual details from user inputs into mock preview cleanly
    const dynamicMockPayload = JSON.parse(JSON.stringify(MOCK_ANALYSIS_RAW_PAYLOAD));
    
    // Dynamic departmental routing mapping
    const categoryRoutingMap = {
      'Roads & Pavement': {
        department: 'Municipal Roads & Public Works',
        assignedUnit: 'Rapid Pavement Squad #4',
        defaultIssue: 'Road Surface Hazard (Pothole / Crater)',
        hours: 4
      },
      'Garbage & Sanitation': {
        department: 'Solid Waste & Sanitation Department',
        assignedUnit: 'Zone Sanitation Fleet #2',
        defaultIssue: 'Uncollected Municipal Waste Accumulation',
        hours: 6
      },
      'Water Supply & Leakage': {
        department: 'Water Supply & Sewerage Board',
        assignedUnit: 'Pipeline Emergency Cell',
        defaultIssue: 'Potable Pipeline Rupture / Supply Leakage',
        hours: 3
      },
      'Streetlights & Electrical': {
        department: 'Electrical Engineering & Public Lighting',
        assignedUnit: 'Streetlight Pole Maintenance Team #8',
        defaultIssue: 'Non-functional Municipal Luminaire',
        hours: 12
      },
      'Drainage & Sewage': {
        department: 'Stormwater Drainage & Sewerage Division',
        assignedUnit: 'Drain Cleaning & Desilting Crew',
        defaultIssue: 'Blocked Stormwater Drain / Sewage Overflow',
        hours: 5
      },
      'Traffic & Signage': {
        department: 'Traffic Engineering & Signal Control',
        assignedUnit: 'Signal & Signage Repair Crew',
        defaultIssue: 'Damaged Traffic Signal / Missing Signboard',
        hours: 8
      },
      'Parks & Public Grounds': {
        department: 'Horticulture & Public Parks Directorate',
        assignedUnit: 'Grounds Maintenance Crew #3',
        defaultIssue: 'Fallen Tree Branch / Damaged Park Equipment',
        hours: 24
      },
      'Other Civic Issue': {
        department: 'Citizen Grievance Central Cell',
        assignedUnit: 'General Civic Inspection Team',
        defaultIssue: 'Unclassified Public Space Grievance',
        hours: 48
      }
    };

    const selectedCategory = report.category || 'Roads & Pavement';
    const routingInfo = categoryRoutingMap[selectedCategory] || categoryRoutingMap['Roads & Pavement'];

    dynamicMockPayload.simulation_result.category = selectedCategory;
    dynamicMockPayload.simulation_result.department = routingInfo.department;
    dynamicMockPayload.simulation_result.assigned_unit = routingInfo.assignedUnit;
    dynamicMockPayload.simulation_result.issue_type = routingInfo.defaultIssue;
    dynamicMockPayload.simulation_result.estimated_resolution_hours = routingInfo.hours;
    dynamicMockPayload.simulation_result.severity = report.priority || 'High';

    if (report.description) {
      dynamicMockPayload.simulation_result.preliminary_notes = 
        `Mock perception generated for input: "${report.description.slice(0, 75)}${report.description.length > 75 ? '...' : ''}" located at "${report.location.addressText}". Automated triage assigned to ${routingInfo.department}.`;
      dynamicMockPayload.simulation_result.reason = 
        `Visual and contextual pattern analysis mapped category "${selectedCategory}" with reported priority "${report.priority || 'High'}". Dispatched to ${routingInfo.department}.`;
    }

    return this.adapter.adapt(dynamicMockPayload);
  }
}

// Default singleton export for UI components
export const analysisService = new AnalysisService();
