/**
 * Citizen Frontend Main Application Entry
 * Orchestrates views:
 * - Tab: "report" -> IssueReportFormComponent (Upload, Details, Category, Severity, Location, Analyze, Confirmation)
 * - Tab: "track"  -> ComplaintTrackerComponent (Look up Complaint ID, live lifecycle timeline, SLA target)
 * Owner: Samyak (Citizen Frontend)
 */

import { HeaderComponent } from './components/Header.js';
import { IssueReportFormComponent } from './components/IssueReportForm.js';
import { ComplaintTrackerComponent } from './components/ComplaintTracker.js';

export class CitizenApp {
  constructor() {
    this.activeTab = 'report';

    this.header = new HeaderComponent({
      currentTab: this.activeTab,
      onTabChange: (tab) => this.switchTab(tab)
    });

    this.tracker = new ComplaintTrackerComponent({
      onNavigateToReport: () => this.switchTab('report')
    });

    this.reportForm = new IssueReportFormComponent({
      onComplaintCreated: (complaint) => {
        // Prepare tracker with newly created complaint
        this.tracker.activeComplaint = complaint;
      },
      onNavigateToTrack: (complaintId) => {
        this.switchTab('track');
        if (complaintId) {
          this.tracker.loadComplaint(complaintId);
        }
      }
    });
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.header.setTab(tab);
    this.renderMainContent();
  }

  renderMainContent() {
    const mainContainer = document.getElementById('app-main');
    if (!mainContainer) return;

    if (this.activeTab === 'report') {
      this.reportForm.render(mainContainer);
    } else if (this.activeTab === 'track') {
      this.tracker.render(mainContainer);
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  init() {
    const headerContainer = document.getElementById('app-header');
    if (headerContainer) {
      this.header.render(headerContainer);
    }

    this.renderMainContent();
  }
}

// Bootstrap once DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CitizenApp().init();
  });
} else {
  new CitizenApp().init();
}
