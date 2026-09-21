/**
 * Header Component — Citizen Portal
 * Includes logo branding, navigation tabs (Report Issue vs Track Complaints), and system status.
 * Owner: Samyak (Citizen Frontend)
 */

export class HeaderComponent {
  constructor({ currentTab = 'report', onTabChange } = {}) {
    this.currentTab = currentTab;
    this.onTabChange = onTabChange;
  }

  setTab(tab) {
    this.currentTab = tab;
    this.render();
  }

  render(container) {
    if (container) {
      this.container = container;
    }
    if (!this.container) return;

    this.container.innerHTML = `
      <header class="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5 shadow-sm">
        <div class="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <!-- Brand Logo & Title -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 flex-shrink-0">
              <i data-lucide="shield-alert" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-base text-slate-100 tracking-tight">CivicResolve</span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-medium border border-cyan-500/20">Citizen Portal</span>
              </div>
              <p class="text-xs text-slate-400 hidden sm:block">Public Municipal Issue Resolution & Tracking Agent</p>
            </div>
          </div>

          <!-- Navigation Controls (Report vs Track) -->
          <div class="flex items-center gap-2 self-start sm:self-auto">
            <nav class="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                type="button"
                id="nav-tab-report"
                class="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  this.currentTab === 'report'
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }"
              >
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Report Issue
              </button>
              <button
                type="button"
                id="nav-tab-track"
                class="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  this.currentTab === 'track'
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }"
              >
                <i data-lucide="compass" class="w-3.5 h-3.5"></i> Track Complaint
              </button>
            </nav>

            <span class="text-[11px] font-medium px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/60 hidden md:flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Portal
            </span>
          </div>

        </div>
      </header>
    `;

    const reportTabBtn = this.container.querySelector('#nav-tab-report');
    const trackTabBtn = this.container.querySelector('#nav-tab-track');

    reportTabBtn?.addEventListener('click', () => {
      if (this.currentTab !== 'report') {
        this.currentTab = 'report';
        this.render();
        if (this.onTabChange) this.onTabChange('report');
      }
    });

    trackTabBtn?.addEventListener('click', () => {
      if (this.currentTab !== 'track') {
        this.currentTab = 'track';
        this.render();
        if (this.onTabChange) this.onTabChange('track');
      }
    });

    if (window.lucide) {
      window.lucide.createIcons({ root: this.container });
    }
  }
}
