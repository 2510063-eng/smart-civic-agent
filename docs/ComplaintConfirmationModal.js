/**
 * Complaint Confirmation Modal Component
 * Displays the officially registered Complaint ID, assigned department,
 * field unit, SLA timeframe, and directs the citizen to the tracking desk.
 * Owner: Samyak (Citizen Frontend)
 */

export class ComplaintConfirmationModalComponent {
  constructor({ onTrackComplaint, onNewReport }) {
    this.onTrackComplaint = onTrackComplaint;
    this.onNewReport = onNewReport;
  }

  show(complaint) {
    let modalRoot = document.getElementById('confirmation-modal-root');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'confirmation-modal-root';
      document.body.appendChild(modalRoot);
    }

    modalRoot.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
        <div class="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-100 flex flex-col gap-5">
          
          <!-- Success Graphic -->
          <div class="text-center pt-2">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-3">
              <i data-lucide="check-check" class="w-7 h-7"></i>
            </div>
            <span class="text-xs font-semibold uppercase tracking-wider text-emerald-400">Complaint Registered Successfully</span>
            <h3 class="text-xl font-extrabold text-white mt-1">Grievance Docket Created</h3>
            <p class="text-xs text-slate-400 mt-1">
              Your civic report has been classified by AI triage and registered with the municipal department.
            </p>
          </div>

          <!-- Official Complaint ID Banner -->
          <div class="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/40 text-center">
            <span class="text-[11px] uppercase tracking-wider text-cyan-400 font-bold block">Official Complaint ID</span>
            <div class="flex items-center justify-center gap-2 mt-1">
              <span class="text-2xl font-black font-mono tracking-widest text-cyan-200" id="confirmed-complaint-id">${complaint.complaintId}</span>
              <button id="btn-copy-id" class="p-1.5 rounded-lg text-cyan-400 hover:text-white hover:bg-cyan-900/60 transition-colors" title="Copy to clipboard">
                <i data-lucide="copy" class="w-4 h-4"></i>
              </button>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 block">Save this ID to monitor field crew resolution progress anytime</span>
          </div>

          <!-- Dispatched Department & SLA Specs -->
          <div class="space-y-2.5 text-xs">
            <div class="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
              <span class="text-slate-400">Routed Department</span>
              <span class="font-semibold text-slate-200 text-right">${complaint.department}</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
              <span class="text-slate-400">Assigned Field Unit</span>
              <span class="font-semibold text-slate-200 text-right">${complaint.assignedUnit}</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
              <span class="text-slate-400">Target Resolution SLA</span>
              <span class="font-semibold text-cyan-300 text-right">${complaint.eta}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-800">
            <button id="btn-confirm-track" class="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20">
              <i data-lucide="compass" class="w-4 h-4"></i> Track Complaint Now
            </button>
            <button id="btn-confirm-done" class="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 transition-colors">
              Close
            </button>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons({ root: modalRoot });
    }

    const copyBtn = modalRoot.querySelector('#btn-copy-id');
    const trackBtn = modalRoot.querySelector('#btn-confirm-track');
    const doneBtn = modalRoot.querySelector('#btn-confirm-done');

    copyBtn?.addEventListener('click', () => {
      navigator.clipboard?.writeText(complaint.complaintId);
      copyBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i>';
      if (window.lucide) window.lucide.createIcons({ root: copyBtn });
      setTimeout(() => {
        copyBtn.innerHTML = '<i data-lucide="copy" class="w-4 h-4"></i>';
        if (window.lucide) window.lucide.createIcons({ root: copyBtn });
      }, 2000);
    });

    trackBtn?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      if (this.onTrackComplaint) {
        this.onTrackComplaint(complaint.complaintId);
      }
    });

    doneBtn?.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      if (this.onNewReport) {
        this.onNewReport();
      }
    });
  }
}
