import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AdCard from './components/AdCard';
import AdModal from './components/AdModal';
import UploadForm from './components/UploadForm';
import CategoryCard from './components/CategoryCard';
import { getAds, getCategories, deleteAd, createCategory, deleteCategory } from './services/api';
import './App.css';

function App() {
  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAd, setSelectedAd] = useState(null);
  const [selectedAdIndex, setSelectedAdIndex] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadAds();
    }
    // eslint-disable-next-line
  }, [selectedCategory, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      await loadCategories();
      if (selectedCategory) {
        await loadAds();
      }
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAds = async () => {
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;
      const data = await getAds(params);
      setAds(data);
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  };

  const handleDeleteAd = async (adId) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      try {
        await deleteAd(adId);
        setAds(ads.filter(ad => ad._id !== adId));
        setSelectedAd(null);
        setSelectedAdIndex(null);
        await loadCategories();
      } catch (error) {
        alert('Error deleting ad');
      }
    }
  };

  const handleUploadSuccess = () => {
    loadData();
    setShowUploadForm(false);
  };

  const handleCategoryCreate = async (categoryData) => {
    try {
      await createCategory(categoryData);
      await loadCategories();
    } catch (error) {
      console.error('Category creation failed:', error);
      throw error;
    }
  };

  const handleCategoryDelete = async (categoryId) => {
    try {
      await deleteCategory(categoryId);
      if (selectedCategory === categoryId) {
        setSelectedCategory('');
      }
      await loadCategories();
    } catch (error) {
      console.error('Category deletion failed:', error);
      throw error;
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchTerm('');
  };

  const getCurrentCategoryName = () => {
    if (!selectedCategory) return null;
    const category = categories.find(cat => cat._id === selectedCategory);
    return category ? category.name : null;
  };

  const isViewingCategories = !selectedCategory;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Sidebar - Always visible */}
      <Sidebar 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        onNewUpload={() => setShowUploadForm(true)}
        onCategoryCreate={handleCategoryCreate}
        onCategoryDelete={handleCategoryDelete}
      />
      
      {/* Main Content - ALWAYS RENDER THIS STRUCTURE */}
      <main className="main-content">
        {/* HEADER - ALWAYS VISIBLE */}
        <header className="app-header">
          <div className="header-left">
            {selectedCategory && (
              <button 
                className="back-button"
                onClick={() => setSelectedCategory('')}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  marginRight: '1rem'
                }}
              >
                ← Back to Categories
              </button>
            )}
            <h1 className="app-title" style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              {selectedCategory ? getCurrentCategoryName() : 'Paper Ads Manager'}
            </h1>
          </div>
          <div className="header-right">
            <input
              type="text"
              placeholder={selectedCategory ? "Search ads..." : "Search categories..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={{
                width: '300px',
                padding: '0.75rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {/* CONTENT CONTAINER */}
        <div className="content-container" style={{
          flex: 1,
          padding: '2rem',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 120px)'
        }}>
          {isViewingCategories ? (
            /* CATEGORIES VIEW */
            <div className="categories-view">
              <div className="section-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
                  Browse Categories
                </h2>
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>Select a category to view ads</p>
              </div>
              
              <div className="categories-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1.5rem',
                maxWidth: '100%'
              }}>
                {categories.length > 0 ? (
                  categories
                    .filter(category => 
                      !searchTerm || 
                      category.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(category => (
                      <CategoryCard
                        key={category._id}
                        category={category}
                        onClick={() => handleCategorySelect(category._id)}
                        onDelete={() => handleCategoryDelete(category._id)}
                      />
                    ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📁</div>
                    <h3>No categories found</h3>
                    <p>Create your first category to organize your ads.</p>
                    <button 
                      className="btn-primary"
                      onClick={() => setShowUploadForm(true)}
                    >
                      Upload First Ad
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ADS VIEW - FORCE PROPER STRUCTURE */
            <div className="ads-view">
              <div className="section-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
                  Ads in {getCurrentCategoryName()}
                </h2>
                <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                  {ads.length} ad{ads.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              {/* FORCED GRID LAYOUT */}
              <div 
                className="ads-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.5rem',
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}
              >
                {ads.length > 0 ? (
                  ads.map((ad, idx) => (
                    <div key={ad._id} style={{
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      height: '400px',
                      width: '100%',
                      maxWidth: '350px',
                      margin: '0 auto',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {/* IMAGE */}
                      <div style={{
                        height: '200px',
                        width: '100%',
                        overflow: 'hidden',
                        background: '#f8fafc'
                      }}>
                        <img 
                          src={`http://localhost:5000/${ad.imagePath}`}
                          alt={ad.title || 'Ad image'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            display: 'block'
                          }}
                          onError={(e) => {
                            e.target.src = `data:image/svg+xml,<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="%23e0e0e0"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="%23333" text-anchor="middle" dy=".3em">Image not found</text></svg>`;
                          }}
                        />
                      </div>
                      
                      {/* INFO */}
                      <div style={{
                        padding: '1rem',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}>
                        <h3 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '0.5rem',
                          lineHeight: '1.4'
                        }}>
                          {ad.title || 'Untitled Ad'}
                        </h3>
                        {ad.description && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            lineHeight: '1.4',
                            flex: 1,
                            marginBottom: '0.5rem'
                          }}>
                            {ad.description.length > 80 
                              ? `${ad.description.substring(0, 80)}...` 
                              : ad.description
                            }
                          </p>
                        )}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                          marginTop: 'auto',
                          fontSize: '0.75rem',
                          color: '#9ca3af'
                        }}>
                          <span>📁 {ad.category?.name || 'Uncategorized'}</span>
                          <span>📅 {new Date(ad.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* ACTIONS */}
                      <div style={{
                        padding: '0.75rem',
                        display: 'flex',
                        gap: '0.5rem',
                        borderTop: '1px solid #e5e7eb',
                        background: 'rgba(248, 250, 252, 0.8)'
                      }}>
                        <button 
                          style={{
                            flex: 1,
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.75rem',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: '#4f46e5',
                            color: 'white'
                          }}
                          onClick={() => {
                            setSelectedAd(ad);
                            setSelectedAdIndex(idx);
                          }}
                        >
                          👁️ View
                        </button>
                        <button 
                          style={{
                            flex: 1,
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.75rem',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: '#ef4444',
                            color: 'white'
                          }}
                          onClick={() => handleDeleteAd(ad._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    gridColumn: '1 / -1'
                  }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🖼️</div>
                    <h3>No ads in this category</h3>
                    <p>Upload some ads to this category to get started.</p>
                    <button 
                      className="btn-primary"
                      onClick={() => setShowUploadForm(true)}
                      style={{
                        background: '#4f46e5',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        marginTop: '1rem'
                      }}
                    >
                      Upload Ad
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {selectedAd && selectedAdIndex !== null && (
        <AdModal
          ad={selectedAd}
          adIndex={selectedAdIndex}
          ads={ads}
          onClose={() => {
            setSelectedAd(null);
            setSelectedAdIndex(null);
          }}
          onNavigate={(newIndex) => {
            setSelectedAd(ads[newIndex]);
            setSelectedAdIndex(newIndex);
          }}
          onDelete={() => handleDeleteAd(selectedAd._id)}
        />
      )}

      {showUploadForm && (
        <UploadForm
          categories={categories}
          onClose={() => setShowUploadForm(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}

export default App;

