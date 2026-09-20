import React from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Building2, 
  ShieldAlert, 
  Copy, 
  Check, 
  FileText 
} from 'lucide-react';

export default function SubmissionSuccess({
  submissionData,
  onTrackComplaint,
  onNewReport,
}) {
  const [copied, setCopied] = React.useState(false);

  const complaintId = submissionData?.complaint_id || 'UNKNOWN';
  const complaint = submissionData?.complaint || {};
  const status = submissionData?.status || complaint.status || 'ASSIGNED';
  const department = complaint.department || 'PENDING_ROUTING';
  const severity = complaint.severity || 'NORMAL';
  const slaDeadline = complaint.sla_deadline || complaint.sla_due_at;

  const copyId = () => {
    navigator.clipboard.writeText(complaintId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Dynamic standard SLA';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="civic-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
      {/* Success Icon */}
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'var(--success-light)',
        color: 'var(--success)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
        border: '2px solid var(--success-border)',
      }}>
        <CheckCircle2 size={36} />
      </div>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--civic-dark)', marginBottom: '0.5rem' }}>
        Complaint Submitted Successfully!
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 2rem', fontSize: '0.95rem' }}>
        Your issue has been recorded and automatically routed by the agent. Save your Complaint ID to track real-time resolution updates.
      </p>

      {/* Complaint ID Highlight Box */}
      <div style={{
        background: '#f1f5f9',
        border: '1px solid var(--civic-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem 2rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '1rem',
        margin: '0 auto 2.5rem',
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Your Complaint ID
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>
            {complaintId}
          </div>
        </div>
        <button
          type="button"
          onClick={copyId}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
          title="Copy Complaint ID"
        >
          {copied ? (
            <>
              <Check size={14} color="var(--success)" /> Copied
            </>
          ) : (
            <>
              <Copy size={14} /> Copy ID
            </>
          )}
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="ai-result-grid" style={{ textAlign: 'left', margin: '0 auto 2.5rem', maxWidth: '750px' }}>
        <div className="metric-card">
          <div className="metric-label">
            <Building2 size={14} />
            Assigned Department
          </div>
          <div className="metric-value" style={{ fontSize: '1.1rem' }}>
            {department.replace(/_/g, ' ')}
          </div>
          <div className="metric-sub">Action unit notified</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <ShieldAlert size={14} />
            Severity Level
          </div>
          <div className="metric-value" style={{ fontSize: '1.1rem' }}>
            {severity}
          </div>
          <div className="metric-sub">Assessed by AI agent</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">
            <Clock size={14} />
            Target SLA Deadline
          </div>
          <div className="metric-value" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            {formatDate(slaDeadline)}
          </div>
          <div className="metric-sub">Autonomous SLA monitoring active</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => onTrackComplaint(complaintId)}
        >
          Track Status Now
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onNewReport}
        >
          <FileText size={16} />
          Report Another Issue
        </button>
      </div>
    </div>
  );
}
