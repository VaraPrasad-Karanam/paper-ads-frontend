import React, { useState, useRef, useCallback, useEffect } from 'react';
import { uploadAd, uploadMultipleAds, createCategory } from '../services/api';

const UploadForm = ({ categories, onClose, onSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [currentEditingImage, setCurrentEditingImage] = useState(null);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('original');
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const fileInputRef = useRef();
  const cameraInputRef = useRef();
  const canvasRef = useRef();
  const previewCanvasRef = useRef();

  // Image enhancement functions
  const applyDocumentScanFilter = (canvas, ctx, imageData, filterType) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    switch (filterType) {
      case 'original':
        // No filter applied - keep original image
        break;
      case 'auto':
        // Auto contrast + brightness + sharpen
        applyAutoContrast(data);
        applyBrightnessContrast(data, 10, 1.2);
        applySharpen(data, width, height);
        break;
      case 'blackwhite':
        // High contrast black and white
        applyBlackWhite(data);
        applyAutoContrast(data);
        break;
      case 'grayscale':
        // Grayscale with enhanced contrast
        applyGrayscale(data);
        applyBrightnessContrast(data, 15, 1.3);
        break;
      case 'whitening':
        // Document whitening
        applyWhitening(data);
        applyBrightnessContrast(data, 20, 1.1);
        break;
      case 'sharpen':
        // Enhanced sharpening
        applySharpen(data, width, height);
        applyBrightnessContrast(data, 5, 1.1);
        break;
      case 'vintage':
        // Vintage document look
        applyVintage(data);
        break;
      default:
        break;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const applyAutoContrast = (data) => {
    let min = 255, max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      min = Math.min(min, gray);
      max = Math.max(max, gray);
    }
    
    const range = max - min;
    if (range === 0) return;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - min) * 255 / range));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - min) * 255 / range));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - min) * 255 / range));
    }
  };

  const applyBrightnessContrast = (data, brightness, contrast) => {
    const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128 + brightness));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128 + brightness));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128 + brightness));
    }
  };

  const applyBlackWhite = (data) => {
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const bw = gray > 128 ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = bw;
    }
  };

  const applyGrayscale = (data) => {
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
  };

  const applyWhitening = (data) => {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + 30);
      data[i + 1] = Math.min(255, data[i + 1] + 30);
      data[i + 2] = Math.min(255, data[i + 2] + 30);
    }
  };

  const applySharpen = (data, width, height) => {
    const sharpenKernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    const output = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += data[idx] * sharpenKernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          output[(y * width + x) * 4 + c] = Math.min(255, Math.max(0, sum));
        }
      }
    }
    
    for (let i = 0; i < data.length; i++) {
      data[i] = output[i];
    }
  };

  const applyVintage = (data) => {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      data[i] = Math.min(255, r * 0.9 + g * 0.5 + b * 0.1);
      data[i + 1] = Math.min(255, r * 0.3 + g * 0.8 + b * 0.1);
      data[i + 2] = Math.min(255, r * 0.2 + g * 0.3 + b * 0.5);
    }
  };

  const updatePreview = useCallback(() => {
    if (!currentEditingImage) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const maxSize = 400;
      let { width, height } = img;
      
      // Apply scaling
      width *= scale;
      height *= scale;
      
      // Calculate display size maintaining aspect ratio
      const ratio = Math.min(maxSize / width, maxSize / height);
      const displayWidth = width * ratio;
      const displayHeight = height * ratio;
      
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      // Apply rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-displayWidth / 2, -displayHeight / 2);
      
      // Draw the image
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
      
      // Apply filter
      if (selectedFilter !== 'original') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        applyDocumentScanFilter(canvas, ctx, imageData, selectedFilter);
      }
      
      ctx.restore();
      
      // Convert to data URL for display
      setPreviewImage(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.src = URL.createObjectURL(currentEditingImage);
  }, [currentEditingImage, selectedFilter, rotation, scale]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  const openImageEditor = (file, index) => {
    setCurrentEditingImage(file);
    setCurrentEditingIndex(index);
    setSelectedFilter('original');
    setRotation(0);
    setScale(1);
    setShowImageEditor(true);
  };

  const applyChangesAndSave = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size based on scale
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      // Apply rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-scaledWidth / 2, -scaledHeight / 2);
      
      // Draw the image
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      ctx.restore();
      
      // Apply filter
      if (selectedFilter !== 'original') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        applyDocumentScanFilter(canvas, ctx, imageData, selectedFilter);
      }
      
      canvas.toBlob((blob) => {
        const enhancedFile = new File([blob], currentEditingImage.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        const newFiles = [...selectedFiles];
        newFiles[currentEditingIndex] = enhancedFile;
        setSelectedFiles(newFiles);
        setShowImageEditor(false);
      }, 'image/jpeg', 0.9);
    };
    
    img.src = URL.createObjectURL(currentEditingImage);
  };

  const handleFileSelect = useCallback((files) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were invalid. Only JPEG, PNG, and PDF files under 10MB are allowed.');
    } else {
      setError('');
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  }, []);

  const removeFile = useCallback((index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) return null;
    try {
      const category = await createCategory({ name: newCategoryName.trim() });
      return category._id;
    } catch (error) {
      setError('Failed to create category');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }
    let categoryId = selectedCategory;
    if (isCreatingCategory) {
      categoryId = await createNewCategory();
      if (!categoryId) return;
    }
    if (!categoryId) {
      setError('Please select or create a category');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      if (selectedFiles.length === 1) {
        formData.append('image', selectedFiles[0]);
        formData.append('title', title || selectedFiles[0].name);
        formData.append('description', description);
        formData.append('category', categoryId);
        await uploadAd(formData, (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        });
      } else {
        selectedFiles.forEach(file => {
          formData.append('images', file);
        });
        const titles = selectedFiles.map(file => title || file.name);
        const descriptions = selectedFiles.map(() => description);
        formData.append('titles', JSON.stringify(titles));
        formData.append('descriptions', JSON.stringify(descriptions));
        formData.append('category', categoryId);
        await uploadMultipleAds(formData, (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        });
      }
      onSuccess();
    } catch (error) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Upload New Ad</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <form className="upload-form" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>Category</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  className="form-control"
                  value={isCreatingCategory ? '' : selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setIsCreatingCategory(false);
                  }}
                  disabled={isCreatingCategory}
                  style={{ flex: 1 }}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                >
                  {isCreatingCategory ? 'Cancel' : 'New'}
                </button>
              </div>
            </div>

            {isCreatingCategory && (
              <div className="form-group">
                <label>New Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Title {selectedFiles.length > 1 && '(will be applied to all files)'}</label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter ad title (optional)"
              />
            </div>

            <div className="form-group">
              <label>Description {selectedFiles.length > 1 && '(will be applied to all files)'}</label>
              <textarea
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter ad description (optional)"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Images/Files</label>
              <div className="upload-options" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div
                  className="file-drop-zone"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ cursor: "pointer" }}
                >
                  <p>Drag and drop files here or click to select</p>
                  <p style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                    Supported: JPEG, PNG, PDF (Max 10MB each)
                  </p>
                </div>
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "#f3f4f6",
                    color: "#23244c",
                    border: "1px solid #d1d5db",
                    fontWeight: "600"
                  }}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <span style={{ fontSize: "1.5rem", marginRight: "0.3rem" }}>📷</span>
                  Take Photo (use camera)
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="file-preview">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-preview-item">
                    {file.type.startsWith('image/') ? (
                      <>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="file-preview-image"
                        />
                        <button
                          type="button"
                          className="enhance-btn"
                          onClick={() => openImageEditor(file, index)}
                          style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            background: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          ✨ Enhance
                        </button>
                      </>
                    ) : (
                      <div className="file-preview-image" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ecf0f1',
                        fontSize: '12px',
                        textAlign: 'center'
                      }}>
                        PDF
                      </div>
                    )}
                    <button
                      type="button"
                      className="file-remove-btn"
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploading && (
              <div className="upload-progress">
                <div
                  className="upload-progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                />
                <p style={{ textAlign: 'center', marginTop: '10px' }}>
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading || selectedFiles.length === 0}
                style={{ flex: 1 }}
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Enhanced Image Editor Modal */}
      {showImageEditor && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔧 Enhance Document</h2>
              <button className="close-btn" onClick={() => setShowImageEditor(false)}>×</button>
            </div>
            
            <div style={{ padding: '1rem', maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
              {/* Preview Section */}
              <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '350px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                ) : (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: '8px' }}>
                    Loading preview...
                  </div>
                )}
              </div>

              {/* Transform Controls */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Transform:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Rotate: {rotation}°
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setRotation(rotation - 90)}
                        style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        ↶ -90°
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotation(rotation + 90)}
                        style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        ↷ +90°
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Scale: {Math.round(scale * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={scale}
                      onChange={(e) => setScale(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setScale(0.5)}
                        style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => setScale(1)}
                        style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        100%
                      </button>
                      <button
                        type="button"
                        onClick={() => setScale(1.5)}
                        style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        150%
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Filter Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Choose Enhancement:</h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: '0.5rem' 
                }}>
                  {[
                    { key: 'original', label: '📸 Original', style: { background: selectedFilter === 'original' ? '#059669' : 'linear-gradient(135deg, #059669, #10b981)', color: 'white' }},
                    { key: 'auto', label: '🚀 Auto', style: { background: selectedFilter === 'auto' ? '#3730a3' : 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white' }},
                    { key: 'blackwhite', label: '⚫ B&W', style: { background: selectedFilter === 'blackwhite' ? '#0f172a' : '#1f2937', color: 'white' }},
                    { key: 'grayscale', label: '🌫️ Gray', style: { background: selectedFilter === 'grayscale' ? '#4b5563' : '#6b7280', color: 'white' }},
                    { key: 'whitening', label: '☀️ White', style: { background: selectedFilter === 'whitening' ? '#e5e7eb' : '#f3f4f6', color: selectedFilter === 'whitening' ? '#1f2937' : '#374151', border: '2px solid #d1d5db' }},
                    { key: 'sharpen', label: '🔍 Sharp', style: { background: selectedFilter === 'sharpen' ? '#047857' : '#10b981', color: 'white' }},
                    { key: 'vintage', label: '📜 Vintage', style: { background: selectedFilter === 'vintage' ? '#b45309' : '#d97706', color: 'white' }}
                  ].map(filter => (
                    <button
                      key={filter.key}
                      type="button"
                      className="btn"
                      onClick={() => setSelectedFilter(filter.key)}
                      style={{
                        ...filter.style,
                        border: selectedFilter === filter.key ? '3px solid #1d4ed8' : filter.style.border || 'none',
                        padding: '0.5rem 0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={applyChangesAndSave}
                  style={{
                    background: '#4f46e5',
                    color: 'white',
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Apply Changes
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowImageEditor(false)}
                  style={{ 
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
    </>
  );
};

export default UploadForm;
