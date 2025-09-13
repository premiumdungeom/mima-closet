// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(__dirname));

// Route for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for other HTML pages
app.get('/:page', (req, res) => {
  const page = req.params.page;
  // Only serve HTML files
  if (page.endsWith('.html')) {
    res.sendFile(path.join(__dirname, page));
  } else {
    res.status(404).send('Not found');
  }
});

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://premium:Rhodesian3@mima.uszw4ds.mongodb.net/mimasplace?retryWrites=true&w=majority&appName=Mima';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  originalPrice: String,
  price: { type: String, required: true },
  description: String,
  image: String,
  category: String,
  mainCategory: String,
  discount: String,
  rating: Number,
  ratingCount: String,
  purchases: String,
  delivery: String,
  soldOut: Boolean
});

const Product = mongoose.model('Product', productSchema);

// Routes

// Get all products with optional pagination
// Get all products with optional pagination
app.get('/api/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0;
    const category = req.query.category;
    
    let query = {};
    
    // Filter by category if provided
    if (category && category !== 'all') {
      query = { mainCategory: new RegExp(category, 'i') };
    }
    
    let productsQuery = Product.find(query).sort({ id: 1 });
    
    // Apply pagination if limit is provided
    if (limit > 0) {
      const skip = (page - 1) * limit;
      productsQuery = productsQuery.skip(skip).limit(limit);
    }
    
    const products = await productsQuery.exec();
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      total,
      page,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: parseInt(req.params.id) });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
app.post('/api/products', async (req, res) => {
  try {
    // Find the highest ID to generate a new one
    const highestIdProduct = await Product.findOne().sort({ id: -1 });
    const newId = highestIdProduct ? highestIdProduct.id + 1 : 1;
    
    const product = new Product({
      ...req.body,
      id: newId
    });
    
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Product with this ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: parseInt(req.params.id) });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Toggle sold out status
app.patch('/api/products/:id/toggle-soldout', async (req, res) => {
  try {
    const product = await Product.findOne({ id: parseInt(req.params.id) });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    product.soldOut = !product.soldOut;
    await product.save();
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle sold out status' });
  }
});

// Get products by category
app.get('/api/products/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0;
    
    let query = {};
    
    if (category !== 'all') {
      query = { mainCategory: new RegExp(category, 'i') };
    }
    
    let productsQuery = Product.find(query).sort({ id: 1 });
    
    // Apply pagination if limit is provided
    if (limit > 0) {
      const skip = (page - 1) * limit;
      productsQuery = productsQuery.skip(skip).limit(limit);
    }
    
    const products = await productsQuery.exec();
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      total,
      page,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products by category' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});