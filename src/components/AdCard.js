import React from 'react';

const AdCard = ({ ad, onView, onDelete }) => {
  const getImageUrl = (imagePath) => {
    return `http://localhost:5000/${imagePath}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="ad-card">
      <div className="ad-card-header">
        <button 
          className="delete-ad-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete ad"
        >
          🗑️
        </button>
      </div>
      
      <div className="ad-image-container">
        <img 
          src={getImageUrl(ad.imagePath)} 
          alt={ad.title || 'Ad image'} 
          className="ad-image"
          onError={(e) => {
            e.target.src = `data:image/svg+xml,<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="%23e0e0e0"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="%23333" text-anchor="middle" dy=".3em">Image not found</text></svg>`;
          }}
        />
      </div>
      
      <div className="ad-info">
        <h3 className="ad-title">{ad.title || 'Untitled Ad'}</h3>
        {ad.description && (
          <p className="ad-description">
            {ad.description.length > 80 
              ? `${ad.description.substring(0, 80)}...` 
              : ad.description
            }
          </p>
        )}
        <div className="ad-meta">
          <span className="ad-category">📁 {ad.category?.name || 'Uncategorized'}</span>
          <span className="ad-date">📅 {formatDate(ad.createdAt)}</span>
        </div>
      </div>
      
      <div className="ad-actions">
        <button className="btn btn-view" onClick={() => onView()}>
          👁️ View
        </button>
        <button className="btn btn-delete" onClick={() => onDelete()}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
};

export default AdCard;
