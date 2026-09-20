import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Building2, 
  ShieldAlert, 
  Target, 
  FileCheck,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { submitComplaint } from '../services/api';

export default function AIAnalysisResult({
  reportData,
  onBackToEdit,
  onSubmitSuccess,
}) {
  const { inputs, analysis } = reportData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Helper for severity color & badge
  const getSeverityBadge = (severity) => {
    const s = (severity || 'LOW').toUpperCase();
    switch (s) {
      case 'CRITICAL':
        return <span className="badge badge-critical">Critical Severity</span>;
      case 'HIGH':
        return <span className="badge badge-high">High Severity</span>;
      case 'MEDIUM':
        return <span className="badge badge-medium">Medium Severity</span>;
      default:
        return <span className="badge badge-low">Low Severity</span>;
    }
  };

  const getSeverityBarColor = (score) => {
    if (score >= 0.8) return 'var(--danger)';
    if (score >= 0.6) return 'var(--warning)';
    if (score >= 0.4) return 'var(--info)';
    return 'var(--success)';
  };

  // Submit confirmed complaint to backend
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await submitComplaint({
        description: inputs.description,
        imageUrl: inputs.imageUrl || null,
        latitude: inputs.latitude,
        longitude: inputs.longitude,
        locationText: inputs.locationText || null,
        citizenId: 'CIT001',
        autoProcess: true,
      });

      onSubmitSuccess(response);
    } catch (err) {
      setError(err.message || 'Failed to submit complaint. Please check backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const severityScore = typeof analysis.severity_score === 'number' ? analysis.severity_score : 0.5;
  const confidenceScore = typeof analysis.confidence === 'number' ? Math.round(analysis.confidence * 100) : 50;

  return (
    <div className="civic-card">
      <div className="card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h2 className="card-title">
              <Sparkles size={24} color="var(--primary)" />
              AI Issue Classification & Analysis
            </h2>
            {analysis.is_stub ? (
              <span className="badge badge-stub" title="Backend is operating with heuristic stub rules">
                Heuristic AI Stub
              </span>
            ) : (
              <span className="badge badge-real" title="Backend processed with production AI model">
                Production AI Brain
              </span>
            )}
          </div>
          <p className="card-desc">
            The civic agent evaluated your report against municipal categories, hazard metrics, and departmental jurisdictions.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* Primary Classification Metrics Grid */}
      <div className="ai-result-grid">
        {/* Issue Type */}
        <div className="metric-card">
          <div className="metric-label">
            <Target size={14} />
            Detected Issue Type
          </div>
          <div className="metric-value" style={{ textTransform: 'capitalize' }}>
            {analysis.issue_type?.replace(/_/g, ' ') || 'Unclassified'}
          </div>
          <div className="metric-sub">
            Confidence: <strong>{confidenceScore}%</strong>
          </div>
        </div>

        {/* Assigned Department */}
        <div className="metric-card">
          <div className="metric-label">
            <Building2 size={14} />
            Target Department
          </div>
          <div className="metric-value" style={{ fontSize: '1.1rem' }}>
            {analysis.department?.replace(/_/g, ' ') || 'General Administration'}
          </div>
          <div className="metric-sub">
            Jurisdiction routing
          </div>
        </div>

        {/* Severity & Score */}
        <div className="metric-card">
          <div className="metric-label">
            <ShieldAlert size={14} />
            Severity & Priority
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            {getSeverityBadge(analysis.severity)}
            {analysis.priority && (
              <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                {analysis.priority} Priority
              </span>
            )}
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${Math.min(100, Math.round(severityScore * 100))}%`,
                background: getSeverityBarColor(severityScore)
              }} 
            />
          </div>
          <div className="metric-sub">
            Severity Index: <strong>{(severityScore * 10).toFixed(1)} / 10</strong>
          </div>
        </div>
      </div>

      {/* Reasoning & Evidence Card */}
      <div className="evidence-box">
        <div className="evidence-title">
          <FileCheck size={16} color="var(--primary)" />
          Agent Reasoning
        </div>
        <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '1rem', lineHeight: '1.6' }}>
          {analysis.reason || analysis.reasoning || 'No specific reasoning returned by agent.'}
        </p>

        {analysis.evidence && analysis.evidence.length > 0 && (
          <>
            <div className="evidence-title" style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Identified Evidence Points
            </div>
            <ul className="evidence-list">
              {analysis.evidence.map((point, index) => (
                <li key={index} className="evidence-item">
                  {point}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Citizen Report Summary */}
      <div style={{ 
        background: '#f8fafc', 
        border: '1px solid var(--civic-border)', 
        borderRadius: 'var(--radius-md)', 
        padding: '1.25rem',
        marginBottom: '2rem' 
      }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          Your Report Details
        </div>
        <div style={{ fontSize: '0.92rem', marginBottom: '0.5rem' }}>
          <strong>Description:</strong> {inputs.description}
        </div>
        {inputs.locationText && (
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            <strong>Location:</strong> {inputs.locationText}
          </div>
        )}
        {(inputs.latitude || inputs.longitude) && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
            GPS: {inputs.latitude}, {inputs.longitude}
          </div>
        )}
        {inputs.imagePreview && (
          <div style={{ marginTop: '0.75rem' }}>
            <img 
              src={inputs.imagePreview} 
              alt="Attached evidence" 
              style={{ maxWidth: '140px', maxHeight: '90px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--civic-border)' }} 
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onBackToEdit}
          disabled={isSubmitting}
        >
          <ArrowLeft size={16} />
          Edit Report
        </button>

        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={handleConfirmSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="spinner" />
              Submitting Complaint...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Confirm & Submit Complaint
            </>
          )}
        </button>
      </div>
    </div>
  );
}
