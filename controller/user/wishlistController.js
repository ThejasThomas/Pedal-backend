const Wishlist = require('../../model/wishlistModel');
const Product = require('../../model/productModel');

const addToWishlist = async (req, res) => {
    try {
        const { product_id, user_id } = req.body;

        // Validate product existence and status
        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        let wishlist = await Wishlist.findOne({ userId: user_id });

        if (wishlist) {
            // Convert ObjectId to string for comparison
            const productExists = wishlist.items.some(item => 
                item.productId && item.productId.toString() === product_id.toString()
            );

            if (productExists) {
                return res.status(400).json({
                    success: false,
                    message: "Product already in wishlist"
                });
            }

            wishlist.items.push({ productId: product_id });
        } else {
            wishlist = new Wishlist({
                userId: user_id,
                items: [{ productId: product_id }]
            });
        }

        await wishlist.save();

        // Return the updated wishlist count
        return res.status(200).json({
            success: true,
            message: "Product added to wishlist successfully",
            data: {
                totalItems: wishlist.items.length
            }
        });

    } catch (error) {
        console.error("Error in addToWishlist:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

const getWishlist = async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Find wishlist and populate product details
        const wishlist = await Wishlist.findOne({ userId: user_id })
            .populate({
                path: 'items.productId',
                model: 'Product',
                select: 'name description basePrice images discountValue discountedAmount status quantity'
            });

        console.log('Found wishlist:', wishlist);

        if (!wishlist) {
            return res.status(200).json({
                success: true,
                message: 'No wishlist found',
                data: {
                    products: [],
                    totalItems: 0
                }
            });
        }

        // Log total items before filtering
        console.log('Total items before filtering:', wishlist.items.length);

        // Filter and map products
        const availableProducts = wishlist.items
            .filter(item => {
                // Log the full item for debugging
                console.log('Processing item:', JSON.stringify(item, null, 2));

                // Check if product exists and is populated
                if (!item || !item.productId) {
                    console.log('Skipping item - no product:', item);
                    return false;
                }

                const product = item.productId;
                
                // Log product details for debugging
                console.log('Product details:', {
                    id: product._id,
                    status: product.status,
                    quantity: product.quantity
                });

                // Return true for any valid product (removing status and quantity check temporarily)
                return true;
            })
            .map(item => {
                const product = item.productId;
                return {
                    productId: product._id,
                    name: product.name,
                    description: product.description,
                    basePrice: product.basePrice,
                    currentPrice: product.discountedAmount 
                        ? product.basePrice - product.discountedAmount 
                        : product.basePrice,
                    discountValue: product.discountValue,
                    images: product.images,
                    quantity: product.quantity
                };
            });

        // Log final results
        console.log('Final available products:', availableProducts.length);

        return res.status(200).json({
            success: true,
            message: 'Wishlist retrieved successfully',
            data: {
                wishlistId: wishlist._id,
                products: availableProducts,
                totalItems: availableProducts.length
            }
        });

    } catch (error) {
        console.error('Error in getWishlist:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve wishlist',
            error: error.message
        });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const { product_id, user_id } = req.body;

        if (!product_id || !user_id) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and User ID are required'
            });
        }

        const updatedWishlist = await Wishlist.findOneAndUpdate(
            { userId: user_id },
            { $pull: { items: { productId: product_id } } },
            { new: true }
        );

        if (!updatedWishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Product removed from wishlist successfully',
            data: {
                wishlistId: updatedWishlist._id,
                totalItems: updatedWishlist.items.length
            }
        });

    } catch (error) {
        console.error('Error in removeFromWishlist:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to remove product from wishlist',
            error: error.message
        });
    }
};

module.exports = {
    addToWishlist,
    getWishlist,
    removeFromWishlist
};