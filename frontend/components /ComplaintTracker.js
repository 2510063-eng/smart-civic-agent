/**
 * Tracking Service & Tracker Component
 * Allows citizens to look up complaints by ID, see real-time progress timelines,
 * department assignments, estimated resolution time, and issue verification status.
 * Owner: Samyak (Citizen Frontend)
 */

import { complaintStore } from '../services/complaintStore.js';

export class ComplaintTrackerComponent {
  constructor({ onNavigateToReport }) {
    this.onNavigateToReport = onNavigateToReport;
    this.activeComplaint = null;
    this.searchQuery = '';
    this.searchError = null;
    this.container = null;
  }

  loadComplaint(id) {
    if (!id) return;
    const complaint = complaintStore.getComplaintById(id);
    if (complaint) {
      this.activeComplaint = complaint;
      this.searchError = null;
      this.searchQuery = complaint.complaintId;
    } else {
      this.searchError = `Complaint with ID "${id}" was not found in municipal records. Please verify the ID format (e.g., CR-2026-8491).`;
      this.activeComplaint = null;
    }
    this.render();
  }

  getStatusBadgeClass(status) {
    switch (status) {
      case 'RESOLVED':
      case 'VERIFIED':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'IN_PROGRESS':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'ASSIGNED':
      case 'ACKNOWLEDGED':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
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

  bindEvents(container) {
    const searchForm = container.querySelector('#tracker-search-form');
    const searchInput = container.querySelector('#tracker-search-input');
    const quickButtons = container.querySelectorAll('.btn-quick-track');
    const btnNewReport = container.querySelector('#btn-tracker-new-report');

    searchForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = searchInput?.value.trim();
      if (!val) {
        this.searchError = "Please enter a valid Complaint ID to track.";
        this.render();
        return;
      }
      this.loadComplaint(val);
    });

    quickButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        if (id) {
          this.loadComplaint(id);
        }
      });
    });

    btnNewReport?.addEventListener('click', () => {
      if (this.onNavigateToReport) {
        this.onNavigateToReport();
      }
    });

    if (window.lucide) {
      window.lucide.createIcons({ root: container });
    }
  }

  render(targetContainer) {
    if (targetContainer) {
      this.container = targetContainer;
    }
    if (!this.container) return;

    const allComplaints = complaintStore.getAllComplaints();

    this.container.innerHTML = `
      <div class="max-w-2xl mx-auto w-full space-y-6">
        
        <!-- Tracking Header Card -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span class="text-xs uppercase font-bold tracking-wider text-cyan-400">Citizen Tracking Desk</span>
            </div>
            <button id="btn-tracker-new-report" class="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors">
              <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> Report Another Issue
            </button>
          </div>

          <h2 class="text-2xl font-extrabold text-white tracking-tight">Track Your Civic Complaint</h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
            Enter your unique Complaint ID (e.g., <code class="text-cyan-400 font-mono">CR-2026-8491</code>) to inspect live field crew progress, AI perception triage notes, and municipal SLA estimates.
          </p>

          <!-- Search Input Form -->
          <form id="tracker-search-form" class="mt-5 flex flex-col sm:flex-row gap-2.5">
            <div class="relative flex-1">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="search" class="w-4 h-4"></i>
              </div>
              <input
                type="text"
                id="tracker-search-input"
                value="${this.searchQuery || ''}"
                placeholder="Enter Complaint ID (e.g. CR-2026-8491)"
                class="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 uppercase tracking-wide font-mono outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              class="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20"
            >
              <i data-lucide="activity" class="w-4 h-4"></i> Track Status
            </button>
          </form>

          ${this.searchError ? `
            <div class="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
              <i data-lucide="alert-circle" class="w-4 h-4 text-rose-400 flex-shrink-0"></i>
              <span>${this.searchError}</span>
            </div>
          ` : ''}

          <!-- Quick access chips for recent complaints -->
          ${allComplaints.length > 0 ? `
            <div class="mt-5 pt-4 border-t border-slate-800/80">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Recent Trackable Complaints (${allComplaints.length}):
              </span>
              <div class="flex flex-wrap gap-2">
                ${allComplaints.map(c => `
                  <button
                    type="button"
                    data-id="${c.complaintId}"
                    class="btn-quick-track text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/60 font-mono flex items-center gap-1.5 transition-colors ${this.activeComplaint?.complaintId === c.complaintId ? 'ring-1 ring-cyan-400 text-cyan-300' : ''}"
                  >
                    <span>${c.complaintId}</span>
                    <span class="text-[10px] text-slate-400 truncate max-w-[120px] font-sans">• ${c.category}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

        </div>

        <!-- Active Complaint Timeline & Detail Card -->
        ${this.activeComplaint ? `
          <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6 animate-fade-in">
            
            <!-- Complaint Top Summary -->
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    ${this.activeComplaint.complaintId}
                  </span>
                  <span class="text-xs px-2.5 py-0.5 rounded-full border font-semibold ${this.getStatusBadgeClass(this.activeComplaint.status)}">
                    ${this.activeComplaint.statusText}
                  </span>
                  <span class="text-xs px-2.5 py-0.5 rounded-full border font-semibold ${this.getSeverityBadge(this.activeComplaint.severity)}">
                    ${this.activeComplaint.severity} Priority
                  </span>
                </div>
                <h3 class="text-xl font-bold text-white mt-2">${this.activeComplaint.title}</h3>
                <p class="text-xs text-slate-400 mt-1">
                  Filed on: <span class="text-slate-300">${new Date(this.activeComplaint.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </p>
              </div>

              <div class="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-right sm:min-w-[170px]">
                <span class="text-[11px] uppercase tracking-wider text-slate-400 block">Estimated SLA Target</span>
                <span class="text-sm font-bold text-cyan-300 mt-0.5 block">${this.activeComplaint.eta}</span>
              </div>
            </div>

            <!-- Key Civic Attributes Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <span class="text-slate-400 uppercase tracking-wider text-[10px] block font-semibold">Department</span>
                <span class="text-slate-100 font-medium mt-1 block">${this.activeComplaint.department}</span>
              </div>
              <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <span class="text-slate-400 uppercase tracking-wider text-[10px] block font-semibold">Assigned Field Unit</span>
                <span class="text-slate-100 font-medium mt-1 block">${this.activeComplaint.assignedUnit || 'Triage in Progress'}</span>
              </div>
              <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <span class="text-slate-400 uppercase tracking-wider text-[10px] block font-semibold">Issue Category</span>
                <span class="text-slate-100 font-medium mt-1 block">${this.activeComplaint.category}</span>
              </div>
            </div>

            <!-- Location & Description -->
            <div class="space-y-3 p-4 rounded-xl bg-slate-800/30 border border-slate-800 text-xs">
              <div>
                <span class="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Location Address</span>
                <p class="text-slate-200 mt-0.5 flex items-start gap-1.5">
                  <i data-lucide="map-pin" class="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0"></i>
                  <span>${this.activeComplaint.location.addressText}</span>
                </p>
              </div>
              <div>
                <span class="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Description</span>
                <p class="text-slate-300 mt-0.5 leading-relaxed">${this.activeComplaint.description}</p>
              </div>
              ${this.activeComplaint.evidenceName ? `
                <div class="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <i data-lucide="paperclip" class="w-3.5 h-3.5 text-slate-400"></i>
                  <span class="text-slate-400">Attached Evidence:</span>
                  <span class="text-slate-200 font-medium">${this.activeComplaint.evidenceName}</span>
                </div>
              ` : ''}
            </div>

            <!-- Resolution Life-Cycle Timeline -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                  <i data-lucide="git-commit" class="w-4 h-4 text-cyan-400"></i>
                  Autonomous Resolution Life-Cycle
                </h4>
                <span class="text-[11px] text-slate-400">Live Stage Updates</span>
              </div>

              <div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                ${this.activeComplaint.steps.map((step, idx) => `
                  <div class="relative">
                    <!-- Timeline Node Icon -->
                    <div class="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step.completed 
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' 
                        : step.current 
                          ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/20 animate-pulse' 
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }">
                      ${step.completed ? '✓' : idx + 1}
                    </div>

                    <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <span class="text-xs font-semibold ${step.completed || step.current ? 'text-slate-100' : 'text-slate-400'}">
                        ${step.label}
                      </span>
                      ${step.timestamp ? `
                        <span class="text-[11px] font-mono text-slate-400">${step.timestamp}</span>
                      ` : `
                        <span class="text-[10px] text-slate-500 italic">Pending</span>
                      `}
                    </div>
                    <p class="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      ${step.description}
                    </p>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>
        ` : `
          <!-- Initial Placeholder when no complaint is selected -->
          <div class="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center text-slate-400 text-xs">
            <i data-lucide="clock" class="w-8 h-8 mx-auto text-slate-600 mb-2"></i>
            <p class="font-medium text-slate-300">No Complaint Currently Selected</p>
            <p class="text-slate-500 mt-1 max-w-sm mx-auto">
              Select one of your recent complaints above, or paste an active complaint ID to view its real-time field status.
            </p>
          </div>
        `}

      </div>
    `;

    this.bindEvents(this.container);
  }
}
