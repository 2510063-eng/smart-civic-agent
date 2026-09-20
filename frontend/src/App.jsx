import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Search, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';
import ReportIssue from './components/ReportIssue';
import AIAnalysisResult from './components/AIAnalysisResult';
import SubmissionSuccess from './components/SubmissionSuccess';
import TrackComplaint from './components/TrackComplaint';

export default function App() {
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'track'
  
  // Reporting workflow step: 'form' | 'analysis' | 'success'
  const [reportStep, setReportStep] = useState('form');
  
  // Data transferred through report flow
  const [reportData, setReportData] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);
  
  // Pre-filled complaint ID for tracking
  const [trackComplaintId, setTrackComplaintId] = useState('');

  // Handle AI analysis completion
  const handleAnalysisComplete = (data) => {
    setReportData(data);
    setReportStep('analysis');
  };

  // Back to edit form
  const handleBackToEdit = () => {
    setReportStep('form');
  };

  // Handle successful submission
  const handleSubmitSuccess = (data) => {
    setSubmissionData(data);
    setReportStep('success');
  };

  // Move to track complaint tab
  const handleTrackComplaint = (complaintId) => {
    setTrackComplaintId(complaintId);
    setActiveTab('track');
  };

  // Reset report flow for a new report
  const handleNewReport = () => {
    setReportData(null);
    setSubmissionData(null);
    setReportStep('form');
    setActiveTab('report');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-icon">
              🏛️
            </div>
            <div>
              <div className="brand-title">
                CivicFix
                <span className="brand-badge">Autonomous Agent</span>
              </div>
              <div className="brand-subtitle">Smart Civic Issue Resolution Portal</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="nav-tabs">
            <button
              type="button"
              className={`nav-tab ${activeTab === 'report' ? 'active' : ''}`}
              onClick={() => setActiveTab('report')}
            >
              <FileText size={16} />
              Report Issue
            </button>
            <button
              type="button"
              className={`nav-tab ${activeTab === 'track' ? 'active' : ''}`}
              onClick={() => setActiveTab('track')}
            >
              <Search size={16} />
              Track Status
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'report' && (
          <>
            {reportStep === 'form' && (
              <ReportIssue onAnalysisComplete={handleAnalysisComplete} />
            )}

            {reportStep === 'analysis' && reportData && (
              <AIAnalysisResult
                reportData={reportData}
                onBackToEdit={handleBackToEdit}
                onSubmitSuccess={handleSubmitSuccess}
              />
            )}

            {reportStep === 'success' && submissionData && (
              <SubmissionSuccess
                submissionData={submissionData}
                onTrackComplaint={handleTrackComplaint}
                onNewReport={handleNewReport}
              />
            )}
          </>
        )}

        {activeTab === 'track' && (
          <TrackComplaint initialComplaintId={trackComplaintId} />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>CivicFix</strong> — Powered by Autonomous Agentic Workflow
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
            <span>Perceive → Reason → Decide → Act</span>
            <span>•</span>
            <span>PRARAMBHA 2.0 (PS01)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
