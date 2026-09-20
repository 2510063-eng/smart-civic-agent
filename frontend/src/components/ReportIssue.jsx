import React, { useState } from 'react';
import { 
  UploadCloud, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  X, 
  Compass, 
  FileText 
} from 'lucide-react';
import { analyzeIssue } from '../services/api';

export default function ReportIssue({ onAnalysisComplete }) {
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [showCoordinates, setShowCoordinates] = useState(false);
  
  // Image handling (stores preview data URL and simulated path)
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  
  // UI states
  const [isLocating, setIsLocating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Handle file upload & preview
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file size must be less than 10MB');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        // Backend expects image_url string (e.g. uploads/filename.jpg)
        setImageUrl(`uploads/${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = (e) => {
    e.stopPropagation();
    setImagePreview(null);
    setImageUrl('');
  };

  // Browser Geolocation
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setShowCoordinates(true);
        if (!locationText) {
          setLocationText(`GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        }
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setError(`Unable to retrieve location (${err.message}). You can enter it manually.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Submit for AI Analysis
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!description || description.trim().length < 3) {
      setError('Please provide a detailed issue description (at least 3 characters).');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeIssue({
        complaintId: `TEMP-${Date.now()}`,
        description: description.trim(),
        imageUrl: imageUrl || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      });

      // Pass both citizen inputs and backend AI result to next stage
      onAnalysisComplete({
        inputs: {
          description: description.trim(),
          imageUrl,
          imagePreview,
          locationText: locationText.trim(),
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
        },
        analysis: result,
      });
    } catch (err) {
      setError(err.message || 'AI analysis request failed. Please check backend.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="civic-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <FileText size={26} color="var(--primary)" />
            Report a Civic Issue
          </h2>
          <p className="card-desc">
            Submit a photo, description, and location. Our autonomous AI agent will analyze, prioritize, and route it to the right municipal department.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleAnalyze}>
        {/* Issue Description */}
        <div className="form-group">
          <label className="form-label" htmlFor="issue-description">
            <span>Issue Description <span style={{ color: 'var(--danger)' }}>*</span></span>
            <span className="optional">Be as descriptive as possible</span>
          </label>
          <textarea
            id="issue-description"
            className="form-textarea"
            rows="4"
            placeholder="e.g., Deep dangerous pothole on the corner of MG Road near Central Bus Stand. Poses accident hazard for two-wheelers."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={3}
          />
        </div>

        {/* Evidence Photo Upload */}
        <div className="form-group">
          <label className="form-label">
            <span>Photo Evidence</span>
            <span className="optional">Recommended for AI visual inspection</span>
          </label>

          {imagePreview ? (
            <div className="preview-container">
              <img src={imagePreview} alt="Issue preview" className="preview-img" />
              <button 
                type="button" 
                className="preview-remove-btn" 
                onClick={clearImage}
                title="Remove photo"
              >
                <X size={14} /> Remove Photo
              </button>
            </div>
          ) : (
            <label className="upload-zone" htmlFor="image-upload">
              <input
                id="image-upload"
                type="file"
                className="file-input"
                accept="image/*"
                onChange={handleImageChange}
              />
              <div className="upload-zone-content">
                <div className="upload-icon">
                  <UploadCloud size={24} />
                </div>
                <div className="upload-text">Click to upload or drag & drop photo</div>
                <div className="upload-subtext">JPG, PNG or WEBP (Max 10MB)</div>
              </div>
            </label>
          )}
        </div>

        {/* Location Section */}
        <div className="form-group">
          <div className="form-label">
            <span>Location / Landmark</span>
            <button
              type="button"
              className="geo-btn"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
            >
              <Compass size={14} />
              {isLocating ? 'Detecting Location...' : 'Use Current Location'}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., MG Road, Near Central Bus Stand, Ward 4"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
            <MapPin 
              size={18} 
              color="var(--text-muted)" 
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} 
            />
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setShowCoordinates(!showCoordinates)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {showCoordinates ? '− Hide GPS Coordinates' : '+ Add Optional GPS Coordinates'}
            </button>
          </div>

          {showCoordinates && (
            <div className="location-inputs-row">
              <div>
                <label className="form-label">
                  <span>Latitude</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g., 16.7050"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">
                  <span>Longitude</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g., 74.2433"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit & Analyze Action */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isAnalyzing || !description.trim()}
          >
            {isAnalyzing ? (
              <>
                <div className="spinner" />
                Analyzing Issue with AI...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze Issue with AI
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
