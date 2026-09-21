/**
 * Citizen Report Domain Model & Validator
 * Owner: Samyak (Citizen Frontend)
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export const ISSUE_CATEGORIES = [
  'Roads & Pavement',
  'Garbage & Sanitation',
  'Water Supply & Leakage',
  'Streetlights & Electrical',
  'Drainage & Sewage',
  'Traffic & Signage',
  'Parks & Public Grounds',
  'Other Civic Issue'
];

export const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export class CitizenReportModel {
  /**
   * Validates citizen report inputs prior to submission/analysis
   * @param {Object} params
   * @param {import('../types/index.ts').Evidence|null} params.evidence
   * @param {string} params.description
   * @param {string} params.addressText
   * @param {string} [params.category]
   * @returns {import('../types/index.ts').ValidationResult}
   */
  static validate({ evidence, description, addressText, category }) {
    const errors = {};

    // 1. Evidence validation
    if (!evidence || !evidence.file) {
      errors.evidence = "Please upload an evidence image of the civic issue.";
    } else {
      if (evidence.file.size > MAX_FILE_SIZE_BYTES) {
        errors.evidence = `The selected image is ${(evidence.file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed size is 10MB.`;
      } else if (evidence.file.type && !evidence.file.type.startsWith('image/')) {
        errors.evidence = "Invalid file type. Please select an image file (JPEG, PNG, WebP).";
      }
    }

    // 2. Category validation
    if (category && !ISSUE_CATEGORIES.includes(category)) {
      errors.category = "Please select a recognized civic issue category.";
    }

    // 3. Description validation
    const trimmedDesc = (description || "").trim();
    if (!trimmedDesc) {
      errors.description = "Please describe the civic issue.";
    } else if (trimmedDesc.length < 10) {
      errors.description = "Description must be at least 10 characters long to provide sufficient detail.";
    }

    // 4. Location validation
    const trimmedLoc = (addressText || "").trim();
    if (!trimmedLoc) {
      errors.location = "Please enter the location or nearest landmark.";
    } else if (trimmedLoc.length < 3) {
      errors.location = "Location must be at least 3 characters long.";
    }

    const isValid = Object.keys(errors).length === 0;

    return {
      isValid,
      errors
    };
  }
}

