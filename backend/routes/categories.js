const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Ad = require('../models/Ad');

// Get all categories with ad counts
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    // Get ad counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const adCount = await Ad.countDocuments({ category: category._id });
        return {
          _id: category._id,
          name: category.name,
          description: category.description,
          createdAt: category.createdAt,
          adCount
        };
      })
    );

    res.json(categoriesWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new category (NO image or file required)
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate name
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({
      name: name.trim(),
      description: description && description.trim() ? description.trim() : ''
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), description: description?.trim() },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    // Check if category has ads
    const adCount = await Ad.countDocuments({ category: req.params.id });
    if (adCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete category with existing ads. Please move or delete all ads first.'
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
