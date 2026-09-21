/**
 * Image Uploader Component
 * Handles evidence image selection, drag-and-drop, preview, replace, and removal.
 * Owner: Samyak (Citizen Frontend)
 */

import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '../models/CitizenReport.js';

export class ImageUploaderComponent {
  constructor({ onImageChange, onError }) {
    this.onImageChange = onImageChange;
    this.onError = onError;
    this.currentEvidence = null;
    this.errorMessage = null;
    this.container = null;
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  handleFileSelect(file) {
    this.errorMessage = null;

    if (!file) {
      return;
    }

    // Validation: Image type check
    const isImage = file.type.startsWith('image/') || ALLOWED_MIME_TYPES.includes(file.type);
    if (!isImage) {
      this.errorMessage = "Selected file is not an image. Please choose an image file (e.g., JPG, PNG, WebP).";
      this.clearImage();
      if (this.onError) this.onError(this.errorMessage);
      return;
    }

    // Validation: File size check (10MB limit)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeStr = this.formatFileSize(file.size);
      this.errorMessage = `Selected image size (${sizeStr}) exceeds the 10 MB maximum limit. Please choose a smaller photo.`;
      this.clearImage();
      if (this.onError) this.onError(this.errorMessage);
      return;
    }

    // Revoke previous object URL if any
    if (this.currentEvidence?.previewUrl) {
      try {
        URL.revokeObjectURL(this.currentEvidence.previewUrl);
      } catch (e) {
        // ignore
      }
    }

    // Create fresh object URL
    const previewUrl = URL.createObjectURL(file);
    this.currentEvidence = {
      file,
      previewUrl,
      name: file.name,
      sizeBytes: file.size,
      type: file.type || 'image/jpeg'
    };

    if (this.onImageChange) {
      this.onImageChange(this.currentEvidence);
    }
    this.render();
  }

  clearImage() {
    if (this.currentEvidence?.previewUrl) {
      try {
        URL.revokeObjectURL(this.currentEvidence.previewUrl);
      } catch (e) {
        // ignore
      }
    }
    this.currentEvidence = null;
    if (this.onImageChange) {
      this.onImageChange(null);
    }
    this.render();
  }

  destroy() {
    if (this.currentEvidence?.previewUrl) {
      try {
        URL.revokeObjectURL(this.currentEvidence.previewUrl);
      } catch (e) {
        // ignore
      }
    }
    this.currentEvidence = null;
    this.container = null;
  }

  bindEvents(container) {
    const dropZone = container.querySelector('#image-dropzone');
    const fileInput = container.querySelector('#image-file-input');
    const removeBtn = container.querySelector('#btn-remove-image');
    const replaceBtn = container.querySelector('#btn-replace-image');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          this.handleFileSelect(file);
        }
        // Reset file input value so selecting the same file again triggers change event
        fileInput.value = '';
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.errorMessage = null;
        this.clearImage();
      });
    }

    if (replaceBtn) {
      replaceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput?.click();
      });
    }

    if (dropZone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.add('border-cyan-500', 'bg-cyan-500/10');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.remove('border-cyan-500', 'bg-cyan-500/10');
        }, false);
      });

      dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt?.files?.[0];
        if (file) {
          this.handleFileSelect(file);
        }
      }, false);

      dropZone.addEventListener('click', (e) => {
        // Trigger file picker
        if (e.target !== fileInput) {
          fileInput?.click();
        }
      });
    }

    if (window.lucide) {
      window.lucide.createIcons({ root: container });
    }
  }

  render(targetContainer) {
    if (targetContainer) {
      this.container = targetContainer;
    }

    if (!this.container) return;

    if (this.currentEvidence) {
      this.container.innerHTML = `
        <div class="rounded-xl border border-slate-700/80 bg-slate-800/60 p-4">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div class="relative w-full sm:w-28 h-36 sm:h-28 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex-shrink-0 shadow-inner flex items-center justify-center">
              <img src="${this.currentEvidence.previewUrl}" alt="Evidence Preview: ${this.currentEvidence.name}" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <i data-lucide="check-circle" class="w-3 h-3"></i> Valid Image Attached
                </span>
              </div>
              <p class="text-sm font-medium text-slate-200 mt-1 truncate" title="${this.currentEvidence.name}">
                ${this.currentEvidence.name}
              </p>
              <p class="text-xs text-slate-400 mt-0.5">
                Size: <span class="text-slate-300 font-mono">${this.formatFileSize(this.currentEvidence.sizeBytes)}</span> • Format: <span class="text-slate-300 uppercase font-mono">${(this.currentEvidence.type || 'image').replace('image/', '')}</span>
              </p>
              
              <div class="flex items-center gap-2.5 mt-3">
                <button type="button" id="btn-replace-image" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600/60 flex items-center gap-1.5 transition-colors">
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Replace Image
                </button>
                <button type="button" id="btn-remove-image" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 flex items-center gap-1.5 transition-colors">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Remove
                </button>
              </div>
            </div>
          </div>
          <!-- Real HTML file input for replacement -->
          <input type="file" id="image-file-input" accept="image/*" class="hidden" />
        </div>
      `;
    } else {
      this.container.innerHTML = `
        <div id="image-dropzone" class="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 bg-slate-850 hover:bg-slate-800/40 rounded-xl p-6 text-center cursor-pointer transition-all duration-150">
          <!-- Real HTML file input -->
          <input type="file" id="image-file-input" accept="image/*" class="hidden" />
          <div class="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 mb-3 border border-slate-700">
            <i data-lucide="camera" class="w-6 h-6"></i>
          </div>
          <p class="text-sm font-semibold text-slate-200">
            Click to upload photo evidence <span class="text-slate-400 font-normal">or drag & drop</span>
          </p>
          <p class="text-xs text-slate-400 mt-1">
            PNG, JPG, WebP, or any standard photo (Maximum file size: 10 MB)
          </p>
          ${this.errorMessage ? `
            <div class="mt-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center justify-center gap-1.5">
              <i data-lucide="alert-circle" class="w-4 h-4 flex-shrink-0"></i>
              <span>${this.errorMessage}</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    this.bindEvents(this.container);
  }
}
