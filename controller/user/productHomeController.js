const express = require('express');
const Product = require('../../model/productModel');

const fetchProductsForUser = async (req, res) => {
  try {
    const { category } = req.query;
    let query = { status: 'Published' }

    if (category) {
      query.category = category.toString()
    }
    console.log('queryy',query);
    
    const products = await Product.find(query);
    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "products not found"
      });
    }
    console.log('proooodct',products);
    
    return res.status(200).json({
      success: true,
      message: "products fetched",
      products
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Error fetching products"
    });
  }
};

module.exports = { fetchProductsForUser };