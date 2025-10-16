import React, { useState, useRef, useEffect } from 'react';

const AdModal = ({
  ad,
  adIndex,
  ads,
  onClose,
  onNavigate,
  onDelete,
}) => {
  // Per-ad images with future multi-image support
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          prevAd();
          break;
        case 'ArrowRight':
          nextAd();
          break;
        case '+': case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleZoomReset();
          break;
        default: break;
      }
    };
    const handleMouseMove = (e) => {
      if (isDragging && zoom > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line
  }, [isDragging, dragStart, position, zoom, ad, adIndex, ads]);

  if (!ad || !ads || adIndex == null) return null;

  // Multi-image per-ad support (future), else single image
  const images = ad.images || [ad.imagePath];
  const currentImage = images[currentImageIndex];

  const getImageUrl = (imagePath) => `http://localhost:5000/${imagePath}`;
  const formatDate = (date) => new Date(date).toLocaleDateString();
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
    if (zoom <= 1) setPosition({ x: 0, y: 0 });
  };
  const handleZoomReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  // Cross-ad navigation!
  const nextAd = () => {
    if (!ads || ads.length < 2) return;
    const next = (adIndex + 1) % ads.length;
    setCurrentImageIndex(0);
    onNavigate(next);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };
  const prevAd = () => {
    if (!ads || ads.length < 2) return;
    const prev = (adIndex - 1 + ads.length) % ads.length;
    setCurrentImageIndex(0);
    onNavigate(prev);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>{ad.title || 'Image Viewer'}</h2>
            {images.length > 1 && (
              <span className="image-counter">
                {currentImageIndex + 1} of {images.length}
              </span>
            )}
          </div>
          <div className="modal-controls">
            <button className="control-btn" onClick={handleZoomOut} title="Zoom Out (-)">
              🔍➖
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button className="control-btn" onClick={handleZoomIn} title="Zoom In (+)">
              🔍➕
            </button>
            <button className="control-btn" onClick={handleZoomReset} title="Reset Zoom (0)">
              🔄
            </button>
            <button className="close-btn" onClick={onClose} title="Close (Esc)">×</button>
          </div>
        </div>
        
        <div className="modal-body-large">
          <div className="image-viewer">
            {/* Cross-ad navigation arrows */}
            {ads.length > 1 && (
              <>
                <button className="nav-arrow nav-left" onClick={prevAd} title="Previous Ad (←)">
                  ‹
                </button>
                <button className="nav-arrow nav-right" onClick={nextAd} title="Next Ad (→)">
                  ›
                </button>
              </>
            )}
            
            {/* Main Image */}
            <div className="image-container-large" style={{ cursor: zoom > 1 ? 'grab' : 'default' }}>
              <img 
                ref={imageRef}
                src={getImageUrl(currentImage)} 
                alt={ad.title || 'Ad image'}
                className="modal-image-large"
                style={{
                  transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  cursor: isDragging ? 'grabbing' : (zoom > 1 ? 'grab' : 'default')
                }}
                onMouseDown={handleMouseDown}
                onDoubleClick={() => {
                  if (zoom === 1) setZoom(2);
                  else handleZoomReset();
                }}
                onError={(e) => {
                  e.target.src = `data:image/svg+xml,<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="%23e0e0e0"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="%23333" text-anchor="middle" dy=".3em">Image not found</text></svg>`;
                }}
              />
            </div>

            {/* Thumbnail Navigation (multi-image support) */}
            {images.length > 1 && (
              <div className="thumbnail-strip">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setZoom(1);
                      setPosition({ x: 0, y: 0 });
                    }}
                  >
                    <img src={getImageUrl(img)} alt={`Thumbnail ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="info-panel">
            <div className="info-section">
              {ad.description && (
                <div className="info-item">
                  <strong>Description:</strong>
                  <p>{ad.description}</p>
                </div>
              )}
              <div className="info-grid">
                <div className="info-item">
                  <strong>Category:</strong>
                  <span>{ad.category?.name || 'Uncategorized'}</span>
                </div>
                <div className="info-item">
                  <strong>Upload Date:</strong>
                  <span>{formatDate(ad.createdAt)}</span>
                </div>
                <div className="info-item">
                  <strong>File Size:</strong>
                  <span>{formatFileSize(ad.fileSize || 0)}</span>
                </div>
                <div className="info-item">
                  <strong>File Type:</strong>
                  <span>{ad.mimeType || 'image/jpeg'}</span>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-danger" onClick={onDelete}>
                  🗑️ Delete Ad
                </button>
                <button className="btn-secondary" onClick={onClose}>
                  ✕ Close
                </button>
              </div>
            </div>
            <div className="instructions">
              <p><strong>Controls:</strong></p>
              <ul>
                <li>🖱️ <strong>Double-click:</strong> Zoom in/out</li>
                <li>🖱️ <strong>Drag:</strong> Pan when zoomed</li>
                <li>⌨️ <strong>+/-:</strong> Zoom in/out</li>
                <li>⌨️ <strong>0:</strong> Reset zoom</li>
                <li>⌨️ <strong>←/→:</strong> Next/Prev ad</li>
                <li>⌨️ <strong>Esc:</strong> Close</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdModal;
