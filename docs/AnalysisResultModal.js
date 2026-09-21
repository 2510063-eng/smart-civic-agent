/**
 * Analysis Result Modal Component
 * 
 * Displays the simulated AI analysis result card/modal with:
 * - Issue Type & Category
 * - Severity / Priority indicator
 * - Department Routing & Assigned Field Unit
 * - Reason & Evidence Verification Status
 * - SLA Resolution Target
 * - "Confirm Complaint & Generate ID" action (Milestone 1 Complete Workflow)
 * - "Dismiss Preview" / "Reset Form" actions
 * Owner: Samyak (Citizen Frontend)
 */

export class AnalysisResultModalComponent {
  constructor({ onDismiss, onReset, onConfirmComplaint }) {
    this.onDismiss = onDismiss;
    this.onReset = onReset;
    this.onConfirmComplaint = onConfirmComplaint;
  }

  getSeverityBadge(severity) {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'High':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  }

  show(analysisResult, reportData) {
    let modalRoot = document.getElementById('analysis-modal-root');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'analysis-modal-root';
      document.body.appendChild(modalRoot);
    }

    const perceivedHtml = (analysisResult.perceivedElements || [])
      .map(elem => `
        <li class="flex items-start gap-2 text-xs text-slate-300">
          <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0"></i>
          <span>${elem}</span>
        </li>
      `).join('');

    modalRoot.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
        <div class="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5">
          
          <!-- Mock Warning Banner -->
          <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2.5">
            <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5"></i>
            <div>
              <span class="font-bold uppercase tracking-wider block text-[11px] text-amber-400">Development Mock Data Only</span>
              <p class="mt-0.5 text-amber-200/90 leading-relaxed font-medium">
                ${analysisResult.disclaimer}
              </p>
              <p class="text-[11px] text-amber-400/80 mt-1">
                Notice: AI triage agent model inference is simulated client-side until the backend connects. Confirming below will generate your official Complaint ID.
              </p>
            </div>
          </div>

          <!-- Header -->
          <div class="flex items-start justify-between border-b border-slate-800 pb-3">
            <div>
              <span class="text-xs uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
                <i data-lucide="scan-eye" class="w-4 h-4"></i>
                AI Perception & Triage Result
              </span>
              <h3 class="text-xl font-bold text-white mt-1">${analysisResult.issueType}</h3>
              <p class="text-xs text-slate-400">Triage Timestamp: ${new Date(analysisResult.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <button id="btn-modal-close" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Key Result Fields Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            
            <!-- Field: Category -->
            <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span class="text-slate-400 font-medium block text-[11px] uppercase tracking-wider">Civic Category</span>
              <span class="text-slate-100 font-semibold mt-1 block">${analysisResult.category || reportData.category || 'Roads & Pavement'}</span>
            </div>

            <!-- Field: Severity / Priority -->
            <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span class="text-slate-400 font-medium block text-[11px] uppercase tracking-wider">Assessed Severity</span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full text-xs font-semibold border ${this.getSeverityBadge(analysisResult.severity)}">
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                ${analysisResult.severity} Priority
              </span>
            </div>

            <!-- Field: Department -->
            <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span class="text-slate-400 font-medium block text-[11px] uppercase tracking-wider">Routed Department</span>
              <span class="text-cyan-300 font-semibold mt-1 block">${analysisResult.department}</span>
            </div>

            <!-- Field: Assigned Unit -->
            <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span class="text-slate-400 font-medium block text-[11px] uppercase tracking-wider">Assigned Field Squad</span>
              <span class="text-slate-200 font-medium mt-1 block">${analysisResult.assignedUnit || 'Rapid Response Squad'}</span>
            </div>

            <!-- Field: Evidence Status -->
            <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span class="text-slate-400 font-medium block text-[11px] uppercase tracking-wider">Evidence Status</span>
              <span class="text-emerald-400 font-medium mt-1 inline-flex items-center gap-1">
                <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                ${analysisResult.evidenceStatus}
              </span>
            </div>

            <!-- Field: Estimated SLA -->
            <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span class="text-slate-400 font-medium block text-[11px] uppercase tracking-wider">Target Resolution Time</span>
              <span class="text-slate-200 font-medium mt-1 block">Within ${analysisResult.estimatedResolutionHours || 4} hours (SLA)</span>
            </div>

          </div>

          <!-- Field: Reason -->
          <div class="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs">
            <span class="text-slate-400 font-medium block text-[11px] uppercase tracking-wider mb-1">AI Reasoning & Field Dispatch Notes</span>
            <p class="text-slate-200 leading-relaxed">${analysisResult.reason}</p>
          </div>

          <!-- Report Inputs Verification Echo -->
          <div class="p-3 rounded-xl bg-slate-800/20 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div class="flex items-center justify-between">
              <span>Location:</span>
              <span class="text-slate-300 font-medium truncate max-w-[280px]">${reportData?.location?.addressText || 'N/A'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Evidence File:</span>
              <span class="text-slate-300 font-medium truncate max-w-[280px]">${reportData?.evidence?.name || 'Attached Photo'}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button id="btn-modal-reset" class="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors">
              Reset Form
            </button>
            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button id="btn-modal-ok" class="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors">
                Dismiss Preview
              </button>
              <button id="btn-modal-confirm" class="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5">
                <i data-lucide="check-check" class="w-4 h-4"></i> Confirm Complaint & Generate ID
              </button>
            </div>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons({ root: modalRoot });
    }

    const closeBtn = modalRoot.querySelector('#btn-modal-close');
    const okBtn = modalRoot.querySelector('#btn-modal-ok');
    const resetBtn = modalRoot.querySelector('#btn-modal-reset');
    const confirmBtn = modalRoot.querySelector('#btn-modal-confirm');

    const closeModal = () => {
      modalRoot.innerHTML = '';
      if (this.onDismiss) this.onDismiss();
    };

    closeBtn?.addEventListener('click', closeModal);
    okBtn?.addEventListener('click', closeModal);

    resetBtn?.addEventListener('click', () => {
      closeModal();
      if (this.onReset) this.onReset();
    });

    confirmBtn?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      if (this.onConfirmComplaint) {
        this.onConfirmComplaint(analysisResult, reportData);
      }
    });
  }
}
