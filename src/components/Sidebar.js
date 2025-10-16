import React, { useState } from 'react';

const Sidebar = ({ categories, selectedCategory, onCategorySelect, onNewUpload, onCategoryCreate, onCategoryDelete }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await onCategoryCreate({ name: newCategoryName.trim() });
      setNewCategoryName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Category creation error:', error);
      setError('Failed to create category');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Are you sure you want to delete "${categoryName}" and all its ads?`)) {
      try {
        await onCategoryDelete(categoryId);
      } catch (error) {
        alert('Failed to delete category.');
      }
    }
  };

  const cancelCreate = () => {
    setShowCreateForm(false);
    setNewCategoryName('');
    setError('');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Categories</h2>
      </div>
      
      <button className="upload-btn" onClick={onNewUpload}>
        <span className="btn-icon">📁</span>
        Upload New Ad
      </button>

      <div className="category-section">
        <div className="category-header">
          <h3 className="section-title">Browse Categories</h3>
          <button 
            className="create-category-button"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <span className="btn-icon">➕</span>
            New Category
          </button>
        </div>

        {showCreateForm && (
          <div className="create-category-form">
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="category-input"
                  disabled={isCreating}
                  autoFocus
                />
              </div>
              <div className="form-buttons">
                <button 
                  type="submit" 
                  className="confirm-btn"
                  disabled={isCreating || !newCategoryName.trim()}
                >
                  {isCreating ? '⏳ Creating...' : '✅ Create'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={cancelCreate}
                  disabled={isCreating}
                >
                  ❌ Cancel
                </button>
              </div>
              {error && <div className="error-message">{error}</div>}
            </form>
          </div>
        )}

        <div className="categories-list">
          <button
            className={`category-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => onCategorySelect('')}
          >
            <span className="category-icon">📂</span>
            <div className="category-info">
              <span className="category-name">All Categories</span>
              <span className="category-count">
                {categories.reduce((total, cat) => total + (cat.adCount || 0), 0)} ads
              </span>
            </div>
          </button>

          {categories.map((category) => (
            <div key={category._id} className="category-item-container">
              <button
                className={`category-item ${selectedCategory === category._id ? 'active' : ''}`}
                onClick={() => onCategorySelect(category._id)}
              >
                <span className="category-icon">📁</span>
                <div className="category-info">
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">{category.adCount || 0} ads</span>
                </div>
              </button>
              <button
                className="delete-category-btn"
                onClick={() => handleDeleteCategory(category._id, category.name)}
                title={`Delete ${category.name}`}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
