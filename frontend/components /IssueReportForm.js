/**
 * Issue Report Form Component
 * Owner: Samyak (Citizen Frontend)
 * 
 * Manages form state:
 * - Issue Category Selection (Roads, Sanitation, Water, Lighting, Drainage, Traffic, Parks, etc.)
 * - Severity / Priority indicator
 * - Evidence Photo Upload (preview, replace, remove)
 * - Issue Details Description (with live character counter)
 * - Location input (street, landmark, ward)
 * - "Analyze Issue" action with realistic loading state
 * - Triggers AnalysisResultModal
 * - Upon confirmation, persists complaint to ComplaintStore and invokes ComplaintConfirmationModal
 */

import { ImageUploaderComponent } from './ImageUploader.js';
import { AnalysisResultModalComponent } from './AnalysisResultModal.js';
import { ComplaintConfirmationModalComponent } from './ComplaintConfirmationModal.js';
import { CitizenReportModel, ISSUE_CATEGORIES, PRIORITY_LEVELS } from '../models/CitizenReport.js';
import { analysisService } from '../services/analysisService.js';
import { complaintStore } from '../services/complaintStore.js';

export class IssueReportFormComponent {
  constructor({ onComplaintCreated, onNavigateToTrack }) {
    this.onComplaintCreated = onComplaintCreated;
    this.onNavigateToTrack = onNavigateToTrack;

    this.evidence = null;
    this.category = 'Roads & Pavement';
    this.priority = 'High';
    this.description = '';
    this.locationText = '';
    this.landmarkText = '';
    this.isSubmitting = false;
    this.errors = {};

    this.imageUploader = new ImageUploaderComponent({
      onImageChange: (evidence) => {
        this.evidence = evidence;
        delete this.errors.evidence;
        this.updateErrorDisplay();
      },
      onError: (msg) => {
        this.errors.evidence = msg;
        this.updateErrorDisplay();
      }
    });

    this.confirmationModal = new ComplaintConfirmationModalComponent({
      onTrackComplaint: (complaintId) => {
        if (this.onNavigateToTrack) {
          this.onNavigateToTrack(complaintId);
        }
      },
      onNewReport: () => {
        this.resetForm();
      }
    });

    this.resultModal = new AnalysisResultModalComponent({
      onDismiss: () => {},
      onReset: () => this.resetForm(),
      onConfirmComplaint: (analysisResult, reportPayload) => {
        this.confirmAndPersistComplaint(analysisResult, reportPayload);
      }
    });
  }

  confirmAndPersistComplaint(analysisResult, reportPayload) {
    const complaintId = complaintStore.generateId();
    const now = new Date();

    const confirmedComplaint = {
      complaintId,
      title: `${analysisResult.issueType} near ${reportPayload.location.addressText.slice(0, 40)}`,
      category: analysisResult.category || this.category,
      severity: analysisResult.severity || this.priority,
      department: analysisResult.department,
      assignedUnit: analysisResult.assignedUnit || 'Rapid Pavement Squad #4',
      location: {
        addressText: reportPayload.location.addressText,
        landmark: this.landmarkText || undefined
      },
      description: reportPayload.description,
      evidenceName: reportPayload.evidence?.name || 'Evidence_Photo.jpg',
      evidencePreviewUrl: reportPayload.evidence?.previewUrl,
      createdAt: now.toISOString(),
      status: 'TRIAGED_BY_AI',
      statusText: 'AI Triage Complete • Awaiting Dispatch',
      eta: `Within ${analysisResult.estimatedResolutionHours || 4} hours (SLA)`,
      steps: [
        {
          label: "AI Triage & Classification",
          description: `Vision & context verified. Routed to ${analysisResult.department}.`,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: true,
          current: false
        },
        {
          label: "Department Dispatch Queue",
          description: `Ticket queued for ${analysisResult.assignedUnit}. Field assignment initiated.`,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: false,
          current: true
        },
        {
          label: "Field Crew Assigned & En Route",
          description: "Operative inspection and equipment deployment.",
          timestamp: null,
          completed: false,
          current: false
        },
        {
          label: "On-Site Repair Execution",
          description: "Civic resolution and photo verification of restored area.",
          timestamp: null,
          completed: false,
          current: false
        },
        {
          label: "Citizen Verification & Docket Closure",
          description: "Automated verification and feedback confirmation.",
          timestamp: null,
          completed: false,
          current: false
        }
      ]
    };

    complaintStore.saveComplaint(confirmedComplaint);

    if (this.onComplaintCreated) {
      this.onComplaintCreated(confirmedComplaint);
    }

    // Show official confirmation modal
    this.confirmationModal.show(confirmedComplaint);
  }

  resetForm() {
    this.evidence = null;
    this.category = 'Roads & Pavement';
    this.priority = 'High';
    this.description = '';
    this.locationText = '';
    this.landmarkText = '';
    this.isSubmitting = false;
    this.errors = {};

    const descInput = document.getElementById('input-description');
    const locInput = document.getElementById('input-location');
    const landmarkInput = document.getElementById('input-landmark');
    const categorySelect = document.getElementById('select-category');
    
    if (descInput) descInput.value = '';
    if (locInput) locInput.value = '';
    if (landmarkInput) landmarkInput.value = '';
    if (categorySelect) categorySelect.value = 'Roads & Pavement';

    const countSpan = document.getElementById('char-count');
    if (countSpan) countSpan.textContent = '0';

    this.imageUploader.clearImage();
    this.updateErrorDisplay();
    this.updateButtonState();
    this.updatePriorityPills();
  }

  updateErrorDisplay() {
    const errorSummary = document.getElementById('form-error-summary');
    const descError = document.getElementById('error-description');
    const locError = document.getElementById('error-location');
    const categoryError = document.getElementById('error-category');

    if (descError) {
      descError.textContent = this.errors.description || '';
      descError.classList.toggle('hidden', !this.errors.description);
    }

    if (locError) {
      locError.textContent = this.errors.location || '';
      locError.classList.toggle('hidden', !this.errors.location);
    }

    if (categoryError) {
      categoryError.textContent = this.errors.category || '';
      categoryError.classList.toggle('hidden', !this.errors.category);
    }

    if (errorSummary) {
      const errorList = Object.values(this.errors).filter(Boolean);
      if (errorList.length > 0) {
        errorSummary.innerHTML = `
          <div class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <i data-lucide="alert-circle" class="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0"></i>
            <div>
              <span class="font-semibold block">Please correct the following before analysis:</span>
              <ul class="list-disc list-inside mt-1 space-y-0.5 text-rose-200">
                ${errorList.map(err => `<li>${err}</li>`).join('')}
              </ul>
            </div>
          </div>
        `;
        errorSummary.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons({ root: errorSummary });
      } else {
        errorSummary.innerHTML = '';
        errorSummary.classList.add('hidden');
      }
    }
  }

  updateButtonState() {
    const btn = document.getElementById('btn-analyze');
    if (!btn) return;

    if (this.isSubmitting) {
      btn.disabled = true;
      btn.innerHTML = `
        <span class="inline-block animate-spin mr-2">⟳</span>
        <span>Simulating AI Perception (Calling Triage Agent)...</span>
      `;
      btn.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
      btn.disabled = false;
      btn.innerHTML = `
        <i data-lucide="sparkles" class="w-4 h-4"></i>
        <span>Analyze Issue</span>
        <span class="text-xs font-normal opacity-75 hidden sm:inline">(Proceeds to AI Perception)</span>
      `;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
      if (window.lucide) window.lucide.createIcons({ root: btn });
    }
  }

  updatePriorityPills() {
    const pills = document.querySelectorAll('.priority-pill');
    pills.forEach(pill => {
      const pLevel = pill.getAttribute('data-priority');
      if (pLevel === this.priority) {
        pill.classList.remove('bg-slate-800/80', 'text-slate-400', 'border-slate-700/60');
        if (pLevel === 'Critical') {
          pill.classList.add('bg-rose-500/25', 'text-rose-300', 'border-rose-500/50', 'ring-1', 'ring-rose-500/40');
        } else if (pLevel === 'High') {
          pill.classList.add('bg-orange-500/25', 'text-orange-300', 'border-orange-500/50', 'ring-1', 'ring-orange-500/40');
        } else if (pLevel === 'Medium') {
          pill.classList.add('bg-amber-500/25', 'text-amber-300', 'border-amber-500/50', 'ring-1', 'ring-amber-500/40');
        } else {
          pill.classList.add('bg-cyan-500/25', 'text-cyan-300', 'border-cyan-500/50', 'ring-1', 'ring-cyan-500/40');
        }
      } else {
        pill.classList.remove('ring-1', 'ring-rose-500/40', 'ring-orange-500/40', 'ring-amber-500/40', 'ring-cyan-500/40', 'bg-rose-500/25', 'text-rose-300', 'bg-orange-500/25', 'text-orange-300', 'bg-amber-500/25', 'text-amber-300', 'bg-cyan-500/25', 'text-cyan-300', 'border-rose-500/50', 'border-orange-500/50', 'border-amber-500/50', 'border-cyan-500/50');
        pill.classList.add('bg-slate-800/80', 'text-slate-400', 'border-slate-700/60');
      }
    });
  }

  async handleAnalyze(e) {
    e?.preventDefault();

    if (this.isSubmitting) return;

    // Read current form values
    const descInput = document.getElementById('input-description');
    const locInput = document.getElementById('input-location');
    const landmarkInput = document.getElementById('input-landmark');
    const categorySelect = document.getElementById('select-category');

    this.description = descInput?.value || '';
    this.locationText = locInput?.value || '';
    this.landmarkText = landmarkInput?.value || '';
    if (categorySelect) this.category = categorySelect.value;

    // Validate using domain validator
    const validation = CitizenReportModel.validate({
      evidence: this.evidence,
      description: this.description,
      addressText: this.locationText,
      category: this.category
    });

    if (!validation.isValid) {
      this.errors = validation.errors;
      this.updateErrorDisplay();
      document.getElementById('form-error-summary')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    this.errors = {};
    this.updateErrorDisplay();
    this.isSubmitting = true;
    this.updateButtonState();

    try {
      const reportPayload = {
        evidence: this.evidence,
        category: this.category,
        priority: this.priority,
        description: this.description.trim(),
        location: {
          addressText: this.locationText.trim(),
          landmark: this.landmarkText.trim() || undefined
        },
        timestamp: new Date().toISOString()
      };

      // Call analysis service
      const analysisResult = await analysisService.analyzeReport(reportPayload);

      // Display the result modal with option to confirm complaint
      this.resultModal.show(analysisResult, reportPayload);
    } catch (err) {
      this.errors.general = "An unexpected error occurred in the analysis service.";
      this.updateErrorDisplay();
    } finally {
      this.isSubmitting = false;
      this.updateButtonState();
    }
  }

  render(container) {
    container.innerHTML = `
      <div class="max-w-2xl mx-auto w-full">
        
        <!-- Workflow Progress Indicator -->
        <div class="mb-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Citizen Reporting Workflow</span>
            <span class="text-cyan-400 font-medium">Smart Civic Intake Flow</span>
          </div>
          <div class="grid grid-cols-4 gap-2 text-center text-xs">
            <!-- Step 1: Report -->
            <div class="flex flex-col items-center">
              <div class="w-8 h-8 rounded-full bg-cyan-500 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-cyan-500/30 ring-2 ring-cyan-400/40">
                1
              </div>
              <span class="mt-1.5 font-semibold text-cyan-300 text-[11px]">Report</span>
              <span class="text-[10px] text-slate-400 hidden sm:inline">Active Intake</span>
            </div>
            <!-- Step 2: Analyze -->
            <div class="flex flex-col items-center">
              <div class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-semibold flex items-center justify-center text-xs border border-slate-700">
                2
              </div>
              <span class="mt-1.5 font-medium text-slate-300 text-[11px]">Analyze</span>
              <span class="text-[10px] text-slate-400 hidden sm:inline">AI Perception</span>
            </div>
            <!-- Step 3: Confirm -->
            <div class="flex flex-col items-center">
              <div class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-semibold flex items-center justify-center text-xs border border-slate-700">
                3
              </div>
              <span class="mt-1.5 font-medium text-slate-300 text-[11px]">Confirm</span>
              <span class="text-[10px] text-slate-400 hidden sm:inline">Docket ID</span>
            </div>
            <!-- Step 4: Track -->
            <div class="flex flex-col items-center">
              <div class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-semibold flex items-center justify-center text-xs border border-slate-700">
                4
              </div>
              <span class="mt-1.5 font-medium text-slate-300 text-[11px]">Track</span>
              <span class="text-[10px] text-slate-400 hidden sm:inline">Live SLA</span>
            </div>
          </div>
        </div>

        <!-- Main Card -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          
          <!-- Header Area -->
          <div class="border-b border-slate-800 pb-5">
            <div class="flex items-center justify-between">
              <span class="text-xs uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
                <i data-lucide="shield-check" class="w-4 h-4"></i> Public Grievance Intake
              </span>
              <button type="button" id="btn-switch-to-track" class="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors">
                <i data-lucide="compass" class="w-3.5 h-3.5"></i> Track Existing Complaint
              </button>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">Report a Civic Issue</h1>
            <p class="text-sm text-slate-400 mt-1.5 leading-relaxed">
              Upload photo evidence, classify the issue category, and describe the hazard. Our AI triage system analyzes your report and dispatches it directly to the designated municipal department.
            </p>
          </div>

          <!-- Form Error Summary -->
          <div id="form-error-summary" class="hidden my-5"></div>

          <!-- The Form -->
          <form id="citizen-report-form" class="mt-6 space-y-6">
            
            <!-- Section 1: Evidence (Image Upload) -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Photo Evidence <span class="text-rose-400">*</span>
                </label>
                <span class="text-xs text-slate-500">JPG, PNG, WebP (Max 10MB)</span>
              </div>
              <div id="uploader-container"></div>
            </div>

            <!-- Section 2: Category & Priority Selection -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <!-- Category Selector -->
              <div class="space-y-2">
                <label for="select-category" class="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Issue Category <span class="text-rose-400">*</span>
                </label>
                <div class="relative">
                  <select
                    id="select-category"
                    class="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 transition-colors outline-none cursor-pointer"
                  >
                    ${ISSUE_CATEGORIES.map(cat => `
                      <option value="${cat}" ${cat === this.category ? 'selected' : ''}>${cat}</option>
                    `).join('')}
                  </select>
                </div>
                <p id="error-category" class="text-xs text-rose-400 hidden"></p>
              </div>

              <!-- Severity / Priority Selector -->
              <div class="space-y-2">
                <label class="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Urgency / Priority
                </label>
                <div class="grid grid-cols-4 gap-1.5 pt-0.5">
                  ${PRIORITY_LEVELS.map(level => `
                    <button
                      type="button"
                      data-priority="${level}"
                      class="priority-pill py-2 px-1 rounded-xl text-xs font-semibold border transition-all text-center ${
                        level === this.priority
                          ? 'bg-orange-500/25 text-orange-300 border-orange-500/50 ring-1 ring-orange-500/40'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                      }"
                    >
                      ${level}
                    </button>
                  `).join('')}
                </div>
              </div>

            </div>

            <!-- Section 3: Issue Details (Description) -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label for="input-description" class="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Issue Description <span class="text-rose-400">*</span>
                </label>
                <span class="text-xs text-slate-500">
                  <span id="char-count">0</span> characters (min 10)
                </span>
              </div>
              <textarea
                id="input-description"
                rows="3"
                placeholder="Describe the condition in detail (e.g., Deep crater pothole on Station Road near the bus stand. Poses serious hazard to two-wheelers and pedestrians)..."
                class="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 transition-colors resize-y leading-relaxed outline-none"
              ></textarea>
              <p id="error-description" class="text-xs text-rose-400 hidden"></p>
            </div>

            <!-- Section 4: Location & Landmark Input -->
            <div class="space-y-3">
              <div class="space-y-2">
                <label for="input-location" class="block text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Street / Address Location <span class="text-rose-400">*</span>
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i data-lucide="map-pin" class="w-4 h-4"></i>
                  </div>
                  <input
                    type="text"
                    id="input-location"
                    placeholder="e.g., Station Road opposite Central Bus Stand, Ward 12"
                    class="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition-colors outline-none"
                  />
                </div>
                <p id="error-location" class="text-xs text-rose-400 hidden"></p>
              </div>

              <div class="space-y-1">
                <label for="input-landmark" class="block text-xs font-medium text-slate-400">
                  Nearest Landmark / Ward (Optional)
                </label>
                <input
                  type="text"
                  id="input-landmark"
                  placeholder="e.g., Opposite Metro Pillar #42, North Wing Gate"
                  class="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 transition-colors outline-none"
                />
              </div>
            </div>

            <!-- Section 5: Action Button -->
            <div class="pt-2">
              <button
                type="submit"
                id="btn-analyze"
                class="w-full py-3.5 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <i data-lucide="sparkles" class="w-4 h-4"></i>
                <span>Analyze Issue</span>
                <span class="text-xs font-normal opacity-75 hidden sm:inline">(Proceeds to AI Perception)</span>
              </button>
            </div>

          </form>

        </div>

      </div>
    `;

    // Mount image uploader child component
    const uploaderContainer = container.querySelector('#uploader-container');
    if (uploaderContainer) {
      this.imageUploader.render(uploaderContainer);
    }

    // Attach form and input events
    const form = container.querySelector('#citizen-report-form');
    const descInput = container.querySelector('#input-description');
    const charCount = container.querySelector('#char-count');
    const locInput = container.querySelector('#input-location');
    const categorySelect = container.querySelector('#select-category');
    const priorityPills = container.querySelectorAll('.priority-pill');
    const btnSwitchTrack = container.querySelector('#btn-switch-to-track');

    btnSwitchTrack?.addEventListener('click', () => {
      if (this.onNavigateToTrack) {
        this.onNavigateToTrack();
      }
    });

    categorySelect?.addEventListener('change', (e) => {
      this.category = e.target.value;
      if (this.errors.category) {
        delete this.errors.category;
        this.updateErrorDisplay();
      }
    });

    priorityPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const selectedP = pill.getAttribute('data-priority');
        if (selectedP) {
          this.priority = selectedP;
          this.updatePriorityPills();
        }
      });
    });

    descInput?.addEventListener('input', (e) => {
      const len = e.target.value.length;
      if (charCount) charCount.textContent = String(len);
      if (this.errors.description && len >= 10) {
        delete this.errors.description;
        this.updateErrorDisplay();
      }
    });

    locInput?.addEventListener('input', (e) => {
      if (this.errors.location && e.target.value.trim().length >= 3) {
        delete this.errors.location;
        this.updateErrorDisplay();
      }
    });

    form?.addEventListener('submit', (e) => {
      this.handleAnalyze(e);
    });

    if (window.lucide) {
      window.lucide.createIcons({ root: container });
    }
  }
}
