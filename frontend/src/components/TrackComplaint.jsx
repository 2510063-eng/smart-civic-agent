import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  Building2, 
  ShieldAlert, 
  MapPin, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Calendar,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { getComplaint, getAgentActions } from '../services/api';

export default function TrackComplaint({ initialComplaintId = '' }) {
  const [searchId, setSearchId] = useState(initialComplaintId);
  const [complaint, setComplaint] = useState(null);
  const [actions, setActions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-search if initial ID passed
  useEffect(() => {
    if (initialComplaintId) {
      setSearchId(initialComplaintId);
      fetchComplaintDetails(initialComplaintId);
    }
  }, [initialComplaintId]);

  const fetchComplaintDetails = async (idToSearch) => {
    const cleanId = (idToSearch || searchId).trim().toUpperCase();
    if (!cleanId) {
      setError('Please enter a valid Complaint ID (e.g., CMP001)');
      return;
    }

    setIsLoading(true);
    setError(null);
    setComplaint(null);
    setActions([]);

    try {
      // Parallel fetch for complaint details & agent audit actions
      const [complaintData, actionsData] = await Promise.allSettled([
        getComplaint(cleanId),
        getAgentActions(cleanId),
      ]);

      if (complaintData.status === 'fulfilled') {
        setComplaint(complaintData.value);
      } else {
        throw complaintData.reason;
      }

      if (actionsData.status === 'fulfilled') {
        setActions(actionsData.value.actions || []);
      } else {
        // Non-blocking: actions may be empty or error
        setActions([]);
      }
    } catch (err) {
      setError(err.message || `Complaint '${cleanId}' not found.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaintDetails(searchId);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  // Helper for status badge
  const renderStatusBadge = (status) => {
    const s = (status || 'ANALYZING').toUpperCase();
    let badgeClass = 'badge-status';
    if (s.includes('ASSIGN')) badgeClass = 'badge-status assigned';
    if (s.includes('PROGRESS')) badgeClass = 'badge-status in_progress';
    if (s.includes('ESCALAT')) badgeClass = 'badge-status escalated';
    if (s.includes('VERIF')) badgeClass = 'badge-status verification';
    if (s.includes('CLOSE') || s.includes('RESOLV')) badgeClass = 'badge-status closed';
    if (s.includes('REOPEN')) badgeClass = 'badge-status reopened';

    return <span className={`badge ${badgeClass}`}>{s.replace(/_/g, ' ')}</span>;
  };

  // Stepper calculations
  const steps = [
    { label: 'Received', key: 'RECEIVED' },
    { label: 'Assigned', key: 'ASSIGNED' },
    { label: 'In Progress', key: 'IN_PROGRESS' },
    { label: 'Verification', key: 'VERIFICATION' },
    { label: 'Resolved / Closed', key: 'CLOSED' },
  ];

  const getStepStatus = (currentStatus, stepIndex) => {
    const s = (currentStatus || '').toUpperCase();
    
    // Status hierarchy index
    let activeIndex = 0;
    if (s === 'ANALYZING' || s === 'NEW') activeIndex = 0;
    else if (s === 'ASSIGNED') activeIndex = 1;
    else if (s === 'IN_PROGRESS' || s === 'FOLLOW_UP') activeIndex = 2;
    else if (s === 'ESCALATED') activeIndex = 2;
    else if (s === 'VERIFICATION') activeIndex = 3;
    else if (s === 'CLOSED' || s === 'RESOLVED') activeIndex = 4;
    else if (s === 'REOPENED') activeIndex = 2;

    if (stepIndex < activeIndex) return 'completed';
    if (stepIndex === activeIndex) return s === 'ESCALATED' ? 'escalated' : 'active';
    return '';
  };

  return (
    <div>
      {/* Search Bar Card */}
      <div className="civic-card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, position: 'relative', minWidth: '240px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Enter Complaint ID (e.g. CMP001)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                style={{ paddingLeft: '2.5rem', fontFamily: 'var(--font-mono)' }}
              />
              <Search
                size={18}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !searchId.trim()}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} />
                  Track Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={20} />
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Complaint Detail Card */}
      {complaint && (
        <>
          <div className="civic-card">
            {/* Header */}
            <div className="card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {complaint.complaint_id}
                  </span>
                  {renderStatusBadge(complaint.status)}
                  {complaint.priority && (
                    <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                      {complaint.priority} Priority
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Filed on {formatDate(complaint.created_at)}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => fetchComplaintDetails(complaint.complaint_id)}
                title="Refresh Status"
              >
                <RefreshCw size={14} className={isLoading ? 'spinner spinner-primary' : ''} />
                Refresh
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="status-stepper">
              <div className="status-stepper-line" />
              {steps.map((step, idx) => {
                const stepClass = getStepStatus(complaint.status, idx);
                return (
                  <div key={step.key} className={`status-step ${stepClass}`}>
                    <div className="status-step-circle">
                      {stepClass === 'completed' ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <div className="status-step-label">{step.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Metrics Grid */}
            <div className="ai-result-grid">
              <div className="metric-card">
                <div className="metric-label">
                  <FileText size={14} />
                  Issue Classification
                </div>
                <div className="metric-value" style={{ textTransform: 'capitalize' }}>
                  {complaint.issue_type?.replace(/_/g, ' ') || 'Unclassified'}
                </div>
                <div className="metric-sub">
                  Confidence: {complaint.confidence ? `${Math.round(complaint.confidence * 100)}%` : '—'}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">
                  <Building2 size={14} />
                  Assigned Department
                </div>
                <div className="metric-value" style={{ fontSize: '1.1rem' }}>
                  {complaint.department?.replace(/_/g, ' ') || 'Not Assigned'}
                </div>
                <div className="metric-sub">Responsible agency</div>
              </div>

              <div className="metric-card">
                <div className="metric-label">
                  <ShieldAlert size={14} />
                  Severity Level
                </div>
                <div className="metric-value" style={{ fontSize: '1.1rem' }}>
                  {complaint.severity || 'NORMAL'}
                </div>
                <div className="metric-sub">
                  Score: {complaint.severity_score ? (complaint.severity_score * 10).toFixed(1) : '—'} / 10
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">
                  <Clock size={14} />
                  SLA Target Deadline
                </div>
                <div className="metric-value" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  {formatDate(complaint.sla_deadline || complaint.sla_due_at)}
                </div>
                <div className="metric-sub">Monitored by autonomous agent</div>
              </div>
            </div>

            {/* Description & Location details */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--civic-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginTop: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Description
              </div>
              <p style={{ fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                {complaint.description}
              </p>

              {(complaint.location_text || complaint.latitude || complaint.longitude) && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={14} /> Location Information
                  </div>
                  {complaint.location_text && (
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      {complaint.location_text}
                    </div>
                  )}
                  {(complaint.latitude || complaint.longitude) && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                      GPS: {complaint.latitude}, {complaint.longitude}
                    </div>
                  )}
                </div>
              )}

              {complaint.reason && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--civic-border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    AI Routing Reason
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    {complaint.reason}
                  </div>
                </div>
              )}

              {/* Resolution / Closed info if available */}
              {(complaint.resolved_at || complaint.closed_at) && (
                <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'var(--success-light)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-text)', fontWeight: 700, fontSize: '0.9rem' }}>
                    <CheckCircle2 size={16} /> Resolution Finalized
                  </div>
                  {complaint.resolved_at && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--success-text)', marginTop: '0.25rem' }}>
                      Resolved at: {formatDate(complaint.resolved_at)}
                    </div>
                  )}
                  {complaint.closed_at && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--success-text)' }}>
                      Verified & Closed at: {formatDate(complaint.closed_at)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Agent Activity Timeline Card */}
          <div className="civic-card">
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>
                  <Activity size={22} color="var(--primary)" />
                  Autonomous Agent Activity Timeline
                </h3>
                <p className="card-desc">
                  Traceable chronological audit trail of all agent decisions and lifecycle events.
                </p>
              </div>
            </div>

            {actions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No agent actions recorded yet for this complaint.
              </div>
            ) : (
              <div className="timeline">
                {actions.map((act) => (
                  <div key={act.id} className="timeline-item">
                    <div className="timeline-marker">
                      <div className="timeline-marker-inner" />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <div className="timeline-action">
                          {act.action_type || act.action || 'AGENT_ACTION'}
                        </div>
                        <div className="timeline-time">
                          {formatDate(act.created_at || act.timestamp)}
                        </div>
                      </div>
                      <div className="timeline-agent">
                        Agent: <strong>{act.agent || 'CivicResolutionAgent'}</strong> • Status: {act.status}
                      </div>

                      {act.description && (
                        <div className="timeline-body" style={{ marginBottom: '0.25rem' }}>
                          {act.description}
                        </div>
                      )}
                      {act.reason && (
                        <div className="timeline-body" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          <strong>Reason:</strong> {act.reason}
                        </div>
                      )}
                      {act.result && (
                        <div className="timeline-result">
                          <strong>Outcome:</strong> {act.result}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State when no complaint searched */}
      {!complaint && !isLoading && !error && (
        <div className="civic-card" style={{ textAlign: 'center', padding: '3.5rem 2rem', color: 'var(--text-muted)' }}>
          <Search size={48} color="var(--civic-border)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--civic-dark)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            Track Your Complaint Status
          </h3>
          <p style={{ maxWidth: '420px', margin: '0 auto', fontSize: '0.9rem' }}>
            Enter your Complaint ID above (e.g. <code>CMP001</code>) to inspect live progress, department actions, and agent activity history.
          </p>
        </div>
      )}
    </div>
  );
}
