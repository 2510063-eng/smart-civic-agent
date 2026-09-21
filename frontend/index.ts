/**
 * Citizen Frontend Domain Types — Milestone 1
 * Owner: Samyak (Citizen Frontend)
 * 
 * NOTE: These types define the citizen-facing domain model.
 * The UI components depend exclusively on these models, decoupled
 * from any backend or mock response payload specifics.
 */

export interface Evidence {
  file: File;
  previewUrl: string;
  name: string;
  sizeBytes: number;
  type: string;
}

export interface LocationInput {
  addressText: string;
  landmark?: string;
  ward?: string;
}

export type IssueCategory = 
  | 'Roads & Pavement'
  | 'Garbage & Sanitation'
  | 'Water Supply & Leakage'
  | 'Streetlights & Electrical'
  | 'Drainage & Sewage'
  | 'Traffic & Signage'
  | 'Parks & Public Grounds'
  | 'Other Civic Issue';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus = 
  | 'TRIAGED_BY_AI'
  | 'ACKNOWLEDGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED';

export interface CitizenReport {
  id?: string;
  evidence: Evidence | null;
  description: string;
  category: IssueCategory;
  priority: PriorityLevel;
  location: LocationInput;
  timestamp: string;
}

export interface FieldValidationErrors {
  evidence?: string;
  description?: string;
  location?: string;
  category?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FieldValidationErrors;
}

export interface AnalysisResult {
  isMock: boolean;
  status: 'ANALYZED' | 'PENDING' | 'ERROR';
  issueType: string;
  category: IssueCategory;
  severity: PriorityLevel;
  reason: string;
  department: string;
  assignedUnit: string;
  evidenceStatus: string;
  estimatedResolutionHours: number;
  confidenceScore: number;
  summaryNotes: string;
  perceivedElements: string[];
  disclaimer: string;
  analyzedAt: string;
}

export interface TrackingStep {
  label: string;
  description: string;
  timestamp: string | null;
  completed: boolean;
  current: boolean;
}

export interface ConfirmedComplaint {
  complaintId: string;
  title: string;
  category: IssueCategory;
  severity: PriorityLevel;
  department: string;
  assignedUnit: string;
  location: LocationInput;
  description: string;
  evidenceName: string;
  evidencePreviewUrl?: string;
  createdAt: string;
  status: ComplaintStatus;
  statusText: string;
  eta: string;
  steps: TrackingStep[];
}

export interface IAnalysisAdapter<TRaw = unknown> {
  adapt(rawResponse: TRaw): AnalysisResult;
}

export interface IAnalysisService {
  analyzeReport(report: CitizenReport): Promise<AnalysisResult>;
}

