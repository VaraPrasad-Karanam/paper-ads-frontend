const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const seedCategories = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB Atlas');
    
    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');
    
    // Create default categories
    const defaultCategories = [
      { name: 'Electronics', description: 'Electronic devices and gadgets' },
      { name: 'Automobiles', description: 'Cars, bikes, and automotive parts' },
      { name: 'Real Estate', description: 'Property and real estate listings' },
      { name: 'Jobs', description: 'Job openings and career opportunities' },
      { name: 'Services', description: 'Professional and personal services' },
      { name: 'Fashion', description: 'Clothing and fashion accessories' },
      { name: 'Home & Garden', description: 'Home decor and gardening items' },
      { name: 'Sports', description: 'Sports equipment and activities' }
    ];
    
    await Category.insertMany(defaultCategories);
    console.log('Seed categories created successfully');
    
    // List all categories
    const categories = await Category.find({});
    console.log('\nCreated categories:');
    categories.forEach(cat => {
      console.log(`- ${cat.name}: ${cat.description}`);
    });
    
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
};

seedCategories();
