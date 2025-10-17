const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Ad = require('../models/Ad');
const Category = require('../models/Category');
const fs = require('fs');
const path = require('path');

// Get all ads with optional category filter
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const ads = await Ad.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    
    res.json(ads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload new ad
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { title, description, category } = req.body;
    
    // Verify category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      // Delete uploaded file if category doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Invalid category' });
    }
    
    const ad = new Ad({
      title: title.trim(),
      description: description?.trim(),
      category,
      imagePath: req.file.path,
      originalFileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size
    });
    
    await ad.save();
    
    // Populate category info before sending response
    await ad.populate('category', 'name');
    
    res.status(201).json(ad);
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
});

// Upload multiple ads
router.post('/bulk', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const { titles, descriptions, category } = req.body;
    
    // Parse arrays (they come as strings from form data)
    const titleArray = JSON.parse(titles || '[]');
    const descriptionArray = JSON.parse(descriptions || '[]');
    
    // Verify category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      // Delete all uploaded files if category doesn't exist
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(400).json({ message: 'Invalid category' });
    }
    
    const ads = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const ad = new Ad({
        title: (titleArray[i] || `Ad ${i + 1}`).trim(),
        description: (descriptionArray[i] || '').trim(),
        category,
        imagePath: file.path,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size
      });
      
      await ad.save();
      await ad.populate('category', 'name');
      ads.push(ad);
    }
    
    res.status(201).json(ads);
  } catch (error) {
    // Delete uploaded files if there's an error
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
    res.status(400).json({ message: error.message });
  }
});

// Get ad by ID
router.get('/:id', async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id).populate('category', 'name');
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    res.json(ad);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update ad
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category } = req.body;
    
    // Verify category exists if provided
    if (category) {
      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }
    
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { 
        title: title?.trim(), 
        description: description?.trim(),
        category 
      },
      { new: true, runValidators: true }
    ).populate('category', 'name');
    
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    
    res.json(ad);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete ad
router.delete('/:id', async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    
    // Delete the image file
    if (fs.existsSync(ad.imagePath)) {
      fs.unlinkSync(ad.imagePath);
    }
    
    await Ad.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
