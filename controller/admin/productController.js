const express = require('express');
const Product = require('../../model/productModel');


const fetchproducts =async(req,res)=>{
  console.log('products');
  
  try{
     const products = await Product.find()

     if(!products){
      return res
      .status(404)
      .json({
        success:false,message:"products not found"
      })
     }
     
     return res
     .status(200)
     .json({
      success:true,message:"products fetched",products
     })
  }catch(err){
    console.log(err);
  }
}
const fetchProductDetails =async(req,res)=>{
  try {
    const {id} =req.params;

    const product = await Product.findById(id);

    if(!product){
      return res.status(404).json({
        success:false,
        message:"Product not found"
      });
    }
    return res.status(200).json({
      success:true,
      message:"Product details fetched successfully",
      product
    })
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success:false,
      message:"Error fetching product details",
      error:err.message
    })
    
  }
}

const addProduct = async (req, res) => {
  const { name,category,images, description, basePrice, quantity } = req.body;
  
  console.log(req.body)
  if (!name || !description || !basePrice || !quantity || !images||!category) {
    return res.status(400).json({
      message: 'Missing required fields',
      required: ['name', 'brand','description','basePrice','quantity','images']
    });
  }

  if (isNaN(Number(basePrice)) || isNaN(Number(quantity))){
    return res.status(400).json({
      message: 'basePrice and quantity must be valid numbers'
    });
  }

  try {
    const product = new Product({
      ...req.body,
      basePrice: Number(basePrice),
      quantity: Number(quantity),
      discount: Number(req.body.discount || 0)
    });

    const savedProduct = await product.save();
    res.status(201).json({
      message: 'Product added successfully',
      product: savedProduct
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({
      message: 'Failed to add product',
      error: error.message
    });
  }
};
const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; 
    
    if (!id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateObject = {
      name: updateData.name || existingProduct.name,
      description: updateData.description || existingProduct.description,
      basePrice: Number(updateData.basePrice) || existingProduct.basePrice,
      discount: Number(updateData.discount) || existingProduct.discount,
      quantity: Number(updateData.quantity) || existingProduct.quantity,
      category: updateData.category || existingProduct.category,
      tags: updateData.tags || existingProduct.tags,
      status: updateData.status || existingProduct.status,
      images: updateData.images || existingProduct.images,
      updatedAt: new Date()
    };

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateObject,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(500).json({ message: 'Failed to update product' });
    }

    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: "Error updating product", error: error.message });
  }
};

const toggleProductListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (status !== 'Published' && status !== 'Unpublished') {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    existingProduct.status = status;
    existingProduct.isHidden = status === 'Unpublished';
    existingProduct.updatedAt = new Date();
    
    await existingProduct.save();
    
    return res.status(200).json({
      success: true,
      message: `Product ${status.toLowerCase()} successfully`,
      product: existingProduct
    });
  } catch (error) {
    console.error('Toggle product listing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update product status',
      error: error.message
    });
  }
};



module.exports = { addProduct,fetchproducts,editProduct,toggleProductListing,fetchProductDetails };

