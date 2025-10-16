import React from 'react';

const CategoryCard = ({ category, onClick, onDelete }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${category.name}" and all its ads?`)) {
      onDelete();
    }
  };

  return (
    <div className="category-card" onClick={onClick}>
      <div className="category-card-header">
        <button 
          className="delete-category-card-btn"
          onClick={handleDelete}
          title="Delete category"
        >
          ×
        </button>
      </div>
      <div className="category-icon">
        📁
      </div>
      <h3 className="category-card-name">{category.name}</h3>
      <p className="category-card-count">
        {category.adCount || 0} {category.adCount === 1 ? 'ad' : 'ads'}
      </p>
      {category.description && (
        <p className="category-card-description">{category.description}</p>
      )}
    </div>
  );
};

export default CategoryCard;
