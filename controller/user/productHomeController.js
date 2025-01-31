const express = require('express');
const Product = require('../../model/productModel');

const fetchProductsForUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const search = req.query.search || '';
    const category = req.query.category;

    let query = {};

    // Add search condition if search query exists
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // case-insensitive search
    }

    // Add category condition if category exists
    if (category) {
      query.category = category;
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      products,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { fetchProductsForUser };