const Offer = require('../../model/offerModel');
const Product = require('../../model/productModel');
const Category=require('../../model/categoryModel')
const mongoose = require('mongoose');
// const { default: products } = require('razorpay/dist/types/products');

const addProductOffer = async (req, res) => {
    try {
        const { id, productName, offerName, offerValue, offerExpairyDate, target_type } = req.body;

        if (!id || !productName || !offerName || !offerValue || !offerExpairyDate || !target_type) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (isNaN(offerValue) || offerValue < 0 || offerValue > 100) {
            return res.status(400).json({
                success: false,
                message: "Offer value must be between 0 and 100"
            });
        }


        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        product.offer = Offer._id
        product. productOffval = offerValue
      await  product.save()

        const expiryDate = new Date(offerExpairyDate);
        if (expiryDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Expiry date must be in the future"
            });
        }

        const existingOffer = await Offer.findOne({
            targetId: id,
            targetType: 'product',
            endDate: { $gt: new Date() }
        });

        if (existingOffer) {
            return res.status(400).json({
                success: false,
                message: "An active offer already exists for this product"
            });
        }

        const newOffer = new Offer({
            name: offerName,
            offerValue: offerValue,
            targetType: target_type,
            targetId: id,
            targetName: productName,
            endDate: offerExpairyDate
        });

        await newOffer.save();

        product.currentOffer = newOffer._id;
        await product.save();

        return res.status(201).json({
            success: true,
            message: "Offer added successfully",
            offer: newOffer
        });

    } catch (error) {
        console.error('Add Product Offer Error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
const getProductOffers = async (req, res) => {
    try {
      const offers = await Offer.find({ targetType: 'product',endDate: { $gt: new Date() } })
  
      res.status(200).json({
        success: true,
        offers: offers,
      })
    } catch (error) {
      console.error('Get Product Offers Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };

 const removeProductOffer =async(req,res)=>{
    try{
        const {offerId} =req.params

        const removedOffer =await Offer.findByIdAndDelete(offerId)

        if(!removedOffer){
            return res.status(404).json({
                success:false,
                message:'Offer not found',
            })
        }

       let productss = await Product.find({_id:removedOffer.targetId})

        await Promise.all(productss.map(async(products)=>{
            products.productOffval = null;
            return products.save()
        }))
        
        
        res.status(200).json({
            success: true,
            message: "Offer deleted successfully",
          })
        } catch (error) {
          console.error("Error deleting product offer:", error)
          res.status(500).json({
            success: false,
            message: "Error deleting product offer",
          })
        }  }

const getOffer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid offer ID"
            });
        }

        const offer = await Offer.findById(id);
        
        if (!offer) {
            return res.status(404).json({
                success: false,
                message: "Offer not found"
            });
        }

        return res.status(200).json({
            success: true,
            offer
        });

    } catch (error) {
        console.error('Get Offer Error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

const createCategoryOffer = async (req, res) => {
    try {
        const { id, CategoryName, offerName, offerValue, offerExpairyDate } = req.body;
        console.log('reqqq',req.body);
        console.log('iddd',id);
        
        

        // Validate category existence
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        
        const existingOffer =await Offer.findOne({
            targetId:id,
            targetType: "category",
            endDate: { $gt: new Date() }

        })

        if(existingOffer){
            return res.status(400).json({
                success: false,
                message: "An active offer already exists for this product"
            });
        }

        // Create new offer
        const offer = new Offer({
            name: offerName,
            offerValue,
            targetType: "category",
            targetId: id,
            targetName: CategoryName,
            endDate: new Date(offerExpairyDate)
        });
        

        await offer.save();
        const products = await Product.find({ category: id });
      console.log("rrrr",products)
      console.log("uuuuu",offerValue)
      await Promise.all(products.map(async (product) => {
          product.catOfferval = Number(offerValue);
          await product.save(); 
      }))

        return res.status(201).json({
            success: true,
            message: 'Category offer created successfully',
            offer
        });
    } catch (error) {
        console.error('Error creating category offer:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error creating category offer'
        });
    }
};
const getAllCategoryOffers = async (req, res) => {
    console.log('working offer');
    
    try {
      const offers = await Offer.find({ targetType: "category", endDate: { $gt: new Date() } })
  
      res.status(200).json({
        success: true,
        offers: offers,
      })
    } catch (error) {
      console.error("Error fetching category offers:", error)
      res.status(500).json({
        success: false,
        message: "Error fetching category offers",
      })
    }
  }
  const removeCategoryOffer = async (req, res) => {
    try {
        const { offerId } = req.params
        console.log(offerId);
        
        const removedOffer = await Offer.findByIdAndDelete(offerId)
    
        if (!removedOffer) {
          return res.status(404).json({
            success: false,
            message: "Offer not found",
          })
        }
    
       let products= await Product.find({ category: removedOffer.targetId })
       console.log('hlo',products);
       
       await Promise.all(products.map(async (product) => {
        product.catOfferval = null;
        // Recalculate currentPrice if needed
        // product.currentPrice = calculateFinalPrice(product);
        return product.save();
    }));
    
        res.status(200).json({
          success: true,
          message: "Offer deleted successfully",
        })
      } catch (error) {
        console.error("Error deleting category offer:", error)
        res.status(500).json({
          success: false,
          message: "Error deleting category offer",
        })
      }  }
  
  

module.exports = {
    addProductOffer,
    getOffer,
    createCategoryOffer,
    getAllCategoryOffers,
    removeCategoryOffer,
    getProductOffers,
    removeProductOffer
};