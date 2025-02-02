const Cart=require('../../model/cartModel')
const Product=require('../../model/productModel')

const addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity, price } = req.body;
        console.log(req.body);
        
        // Basic validation
        if (!userId || !productId || !quantity || !price) {
            return res.status(400).json({
                success: false,
                message: "All fields are required (userId, productId, quantity, price)"
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        if (product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: "Product is out of stock or requested quantity exceeds available stock",
                availableQuantity: product.quantity
            });
        }

        let cart = await Cart.findOne({ userId });
        
        if (cart) {
            const existingProduct = cart.products.find(
                (item) => item.productId.toString() === productId
            );
            
            if (existingProduct) {
                const newTotalQuantity = existingProduct.quantity + quantity;
                                if (newTotalQuantity > 15) {
                    return res.status(400).json({
                        success: false,
                        message: "Maximum limit is 15 items per product",
                        currentCartQuantity: existingProduct.quantity,
                        remainingAllowed: 15 - existingProduct.quantity
                    });
                }
                if (newTotalQuantity > product.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: "The product is out of stock ",
                        availableQuantity: product.quantity,
                        currentCartQuantity: existingProduct.quantity
                    });
                }
                
                existingProduct.quantity = newTotalQuantity;
                existingProduct.totalPrice = newTotalQuantity * price;
            } else {
                if (quantity > 15) {
                    return res.status(400).json({
                        success: false,
                        message: "Maximum limit is 15 items per product",
                        remainingAllowed: 15
                    });
                }
                
                cart.products.push({
                    productId,
                    quantity,
                    price,
                    totalPrice: quantity * price
                });
            }
            
            cart.cartTotal = cart.products.reduce(
                (total, item) => total + item.totalPrice, 0
            );
            
            await cart.save();
        } else {
            if (quantity > 15) {
                return res.status(400).json({
                    success: false,
                    message: "Maximum limit is 15 items per product",
                    remainingAllowed: 15
                });
            }
            
            cart = await Cart.create({
                userId,
                products: [{
                    productId,
                    quantity,
                    price,
                    totalPrice: quantity * price
                }],
                cartTotal: quantity * price
            });
        }

        res.status(200).json({
            success: true,
            message: "Product added to cart successfully",
            cart
        });
        
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: "Error adding product to cart",
            error: error.message
        });
    }
};
const updateCart = async (req, res) => {
    try {
        const { userId, productId, quantity, price } = req.body;

        if (!userId || !productId || !quantity || !price) {
            return res.status(400).json({
                success: false,
                // message: "All fields are required (userId, productId, quantity, price)"
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1"
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (quantity > 15) {
            return res.status(400).json({
                success: false,
                message: "Maximum limit is 15 items per product",
                currentQuantity: quantity,
                maximumAllowed: 15
            });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity exceeds available stock",
                availableQuantity: product.quantity,
                requestedQuantity: quantity
            });
        }

    
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const productIndex = cart.products.findIndex(
            item => item.productId.toString() === productId
        );

        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart"
            });
        }

        cart.products[productIndex].quantity = quantity;
        cart.products[productIndex].totalPrice = quantity * price;

        cart.cartTotal = cart.products.reduce(
            (total, item) => total + item.totalPrice, 
            0
        );

        await cart.save();

        const populatedCart = await Cart.findById(cart._id)
            .populate('products.productId', 'name description images price quantity');

        res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            cart: populatedCart
        });

    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: "Error updating cart",
            error: error.message
        });
    }
};
const validateCart = async (req, res) => {
    try {
        const { userId } = req.params;

        const cart = await Cart.findOne({ userId })
            .populate('products.productId', 'name quantity');

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        let errors = [];

        for (const cartItem of cart.products) {
            const product = cartItem.productId;

            if (!product) {
                errors.push(`Product no longer available`);
                continue;
            }

            if (cartItem.quantity > 15) {
                errors.push(`${product.name}: Maximum limit is 15 items per product`);
            }

            if (product.quantity < cartItem.quantity) {
                errors.push(`${product.name}: Only ${product.quantity} items available`);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Cart validation failed",
                errors: errors
            });
        }

        res.status(200).json({
            success: true,
            message: "Cart is valid",
            cart
        });

    } catch (error) {
        console.error('Validate cart error:', error);
        res.status(500).json({
            success: false,
            message: "Error validating cart",
            error: error.message
        });
    }
};


const clearCart = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        await Cart.updateOne(
            { userId },
            { 
                $set: {
                    products: [],
                    cartTotal: 0
                  }
            }
        );

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully"
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        return res.status(500).json({
            success: false,
            message: "Error clearing cart",
            error: error.message
        });
    }
};

const getCartDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('userrr id',userId);
        

        if (!userId) {
            
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }
        const cart = await Cart.findOne({ userId }).populate({
            path: 'products.productId',
            model: 'Product',
            select: 'name description images price category '
        });

        if (!cart) {
            return res.status(200).json({
                success: true,
                message: "Cart is empty",
                cart: {
                    userId,
                    products: [],
                    cartTotal: 0
                }
            });
        }
        console.log(cart.products);
        
        const cartDetails = {
            userId: cart.userId,
            products: cart.products.map(item => ({
                productId: item.productId._id,
                name: item.productId.name,
                description: item.productId.description,
                images: item.productId.images[0],
                basePrice: item.price,
                quantity: item.quantity,
                category: item.productId.category,
                images: item.productId.images,
                totalPrice: item.totalPrice,
            })),
            cartTotal: cart.cartTotal

        };

        res.status(200).json({
            success: true,
            message: "Cart details fetched successfully",
            cart: cartDetails
        });

    } catch (error) {
        console.error('Get cart details error:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching cart details",
            error: error.message
        });
    }
};
const removeFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.params;

        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Product ID are required"
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }
        cart.products = cart.products.filter(item => 
            item.productId.toString() !== productId
        );
        
        cart.cartTotal = cart.products.reduce((total, item) => 
            total + item.totalPrice, 0
        );

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart: cart
        });

    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: "Error removing product from cart",
            error: error.message
        });
    }
};
module.exports ={addToCart,updateCart,validateCart,clearCart,getCartDetails,removeFromCart}