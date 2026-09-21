# Citizen Frontend — Milestone 1: Issue Intake & Preview

**Owner:** Samyak (Citizen Frontend)  
**Module Directory:** `/frontend`  
**Milestone:** 1 — Citizen Issue Reporting & Isolated Mock Perception

---

## 1. Overview & Architecture

The Citizen Frontend is isolated completely within `/frontend`. It provides an intuitive, accessible citizen reporting interface with evidence upload, description input, manual location entry, and input validation.

### Layered Separation
```
UI Components (IssueReportForm, ImageUploader, AnalysisResultModal, Header)
   ↓
Frontend Service Layer (analysisService.js)
   ↓
Adapter Layer (mockAnalysisAdapter.js)
   ↓
Mock Transport Source (mockAnalysisData.js)
```

The UI components depend strictly on domain TypeScript models (`CitizenReport`, `Evidence`, `LocationInput`, `AnalysisResult`). They never reference mock payload structures or backend transport representations directly.

---

## 2. Directory Structure

```
frontend/
├── package.json                   # Frontend metadata and typecheck scripts
├── tsconfig.json                  # TypeScript compiler options
├── README.md                      # Milestone 1 documentation & integration guide
├── index.html                     # Citizen Portal entry point
├── css/
│   └── styles.css                 # Custom styles & animations
└── src/
    ├── app.js                     # Main application bootstrap
    ├── types/
    │   └── index.ts               # Shared TypeScript domain interfaces
    ├── models/
    │   └── CitizenReport.js       # Domain model & input validator
    ├── services/
    │   ├── analysisService.js     # Analysis Service layer
    │   ├── adapters/
    │   │   └── mockAnalysisAdapter.js # Mock adapter mapping to AnalysisResult
    │   └── mocks/
    │       └── mockAnalysisData.js    # Mock payload for development
    └── components/
        ├── Header.js              # Top bar navigation & milestone badge
        ├── ImageUploader.js       # Drag-and-drop, preview, replace/remove
        ├── IssueReportForm.js     # Main reporting card & state manager
        └── AnalysisResultModal.js # Mock perception preview modal
```

---

## 3. Data Formats

### 3.1 Input Format (`CitizenReport`)
```typescript
interface CitizenReport {
  evidence: {
    file: File;
    previewUrl: string;
    name: string;
    sizeBytes: number;
    type: string;
  } | null;
  description: string;
  location: {
    addressText: string;
  };
  timestamp: string;
}
```

### 3.2 Domain Output Format (`AnalysisResult`)
```typescript
interface AnalysisResult {
  isMock: boolean;
  status: 'ANALYZED' | 'PENDING' | 'ERROR';
  issueType: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  reason: string;
  department: string;
  evidenceStatus: string;
  confidenceScore: number;
  summaryNotes: string;
  perceivedElements: string[];
  disclaimer: string;
  analyzedAt: string;
}
```

---

## 4. Testing the Milestone

1. **Type Checking:**
   ```bash
   cd frontend
   npx tsc --noEmit
   ```
2. **Serving the Frontend:**
   Any static server or browser can open `frontend/index.html` directly:
   ```bash
   npx serve frontend
   # or
   python -m http.server 3001 -d frontend
   ```
3. **Interactive Validation Checklist:**
   - **Form Validation**: Click "Analyze Issue" with empty inputs. Verify that validation errors appear for photo, description, and location.
   - **Image Upload**: Drag or select an image (`.jpg`, `.png`, `.webp`). Verify the preview thumbnail, size, format, and "Replace" / "Remove" controls.
   - **File Validation**: Attempt uploading non-image files or files > 10MB; verify clear validation messages.
   - **Description Validation**: Enter fewer than 10 characters; verify minimum length enforcement.
   - **Mock Service Call**: Fill all fields and click "Analyze Issue". Verify loading indicator, followed by the "Development Mock Data Only" modal dialog with the mapped mock perception data.

---

## 5. Future Backend Integration Notes (For Piyush)

When the backend API contract is finalized by Piyush:
1. Provide the exact HTTP method, endpoint URL (e.g., `POST /api/v1/complaints/analyze`), and multipart payload format.
2. Implement a `RealAnalysisAdapter` inside `src/services/adapters/` that maps the backend JSON to `AnalysisResult`.
3. Provide environment variable configuration mechanism for the backend URL without hard-coding in the client.
4. Replace the mock service in `src/services/analysisService.js` with the real HTTP call.
