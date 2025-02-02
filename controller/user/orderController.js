const Order = require("../../model/orderModel");
const Cart = require("../../model/cartModel");
const Product = require("../../model/productModel");
const Wallet=require('../../model/walletModel')
const User=require('../../model/userModel')
const Razorpay =require('razorpay')
const crypto=require('crypto')
require('dotenv').config();


if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('Razorpay credentials are missing');
}


const placeOrderList = async (req, res) => {
  try {
    const { userId,images, addressId, paymentMethod, items, totalAmount,couponDiscount } = req.body;
    console.log(req.body);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }
    console.log('paymnt',paymentMethod);
    
    console.log('img',images);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid total amount is required",
      });
    }

    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return res.status(400).json({
          success: false,
          message: "Each order item must have productId, quantity, and price",
        });
      }
    }

    const orderProducts = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new Error(`Product not found with id: ${item.productId}`);
        }
        if (product.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }
        const updatedQuantity = product.quantity - item.quantity;
        await Product.findByIdAndUpdate(item.productId, {
          quantity: updatedQuantity
        });
        await Cart.updateOne(
          { userId, "products.productId": item.productId },
          { $set: { "products.$.orderPlaced": true } }
      );      
      const discountType = product.productOffval ? 'Product Offer' : 
                           (product.catOfferval ? 'Category Offer' : 'No Offer');
        
        const discountAmount = product.discountedAmount || 0;
        const appliedDiscount = product.discountValue || 0;
        const itemTotal = Number(item.price) * Number(item.quantity);
        const itemCouponDiscount = couponDiscount ? (couponDiscount / items.length) : 0;
        const paidAmount = itemTotal - itemCouponDiscount;


        return {
          product: item.productId,
          quantity: item.quantity,
          price: item.price,
          productName: product.name,
          productImage: product.images?.[0],
          productDescription: product.description,
          originalPrice: product.basePrice,
          couponDiscount: couponDiscount || 0,
          appliedDiscount: product.discountValue,
          discountAmount: product.discountedAmount,
          productPaidAmount: paidAmount,
          discountType: product.productOffval ? 'Product Offer' : (product.catOfferval ? 'Category Offer' : 'No Offer'),
          productOfferValue: product.productOffval,
          categoryOfferValue: product.catOfferval
        };
      })

    );

    let razorpayOrder = null;

    const orderData = {
      user: userId,
      products: orderProducts,
      totalAmount,
      originalTotalAmount: orderProducts.reduce((sum, item) => 
        sum + (item.originalPrice * item.quantity), 0),
      totalDiscountAmount: orderProducts.reduce((sum, item) => 
        sum + ((item.discountAmount || 0) * item.quantity), 0),
      paymentMethod,
      shippingAddress: addressId,
      orderStatus: paymentMethod === 'UPI' ? 'PENDING' : 'ON THE ROAD',
    };

    if (paymentMethod === 'UPI') {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        payment_capture: 1
      });
      orderData.razorpayOrderId = razorpayOrder.id;
    }

    const newOrder = new Order({
      user: userId,
      products: orderProducts,
      totalAmount,
      originalTotalAmount: orderProducts.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0),
      totalDiscountAmount: orderProducts.reduce((sum, item) => sum + (item.discountAmount * item.quantity), 0),
      paymentMethod,
      couponDiscount,
      shippingAddress: addressId,
      orderStatus:paymentMethod === 'UPI' ? 'PENDING' : 'ON THE ROAD',
      razorpayOrderId: razorpayOrder?.id

    });
    console.log('neworder',newOrder);
    

    await newOrder.save();
    await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });

    const populatedOrder = await Order.findById(newOrder._id)
      .populate("user", "firstName email")
      .populate("products.product", "name images description");

    return res.status(200).json({
      success: true,
      message: "Order placed successfully",
      order: populatedOrder,
      razorpayOrder: razorpayOrder ? {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      } : null
    });
  } catch (error) {
    console.error("Order placement error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to place order",
    });
  }
}

const returnReqest = async (req, res) => {
  try {
    const { reason, explanation, orderId, itemId } = req.body;
    console.log(req.body);
    if (!reason || !explanation || !orderId || !itemId) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const orderData = await Order.findOne({ _id: orderId });
    if (!orderData) {
      return res.status(404).json({ message: "Order not found" });
    }
    console.log('rfvtv',orderData);
    
    const returnItem = orderData.products.find((item) => item._id.toString() === itemId)
    console.log("jij8j9iji9m",returnItem);
    if (!returnItem) {
      return res.status(404).json({ message: "Item not found in order" });
    }
    if (!returnItem.returnReq) {
      returnItem.returnReq = {};
    }

    returnItem.returnReq.reason = reason;
    returnItem.returnReq.explanation = explanation;
    returnItem.returnReq.requestStatus = "Pending";
   
        
console.log("saving")
    await orderData.save()

    return res.status(200).json({ message: "Return request registered successfully" })

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "An error occurred while processing the return request" });
  }
};


const checkProductAvailability = async (req, res) => {
  try {
      const { cartItems } = req.body;

      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
          return res.status(400).json({
              success: false,
              message: "Invalid cart items"
          });
      }

      for (const item of cartItems) {
          const { productId, quantity } = item;

          if (!productId || !quantity) {
              return res.status(400).json({
                  success: false,
                  message: "Each cart item must have a productId and quantity"
              });
          }

          const product = await Product.findById(productId);

          if (!product) {
              return res.status(404).json({
                  success: false,
                  message: `Product with ID ${productId} not found`
              });
          }

          if (product.quantity < quantity) {
              return res.status(400).json({
                  success: false,
                  message: `Insufficient stock for product ${product.name}`,
                  productId,
                  requestedQuantity: quantity,
                  availableQuantity: product.quantity
              });
          }
      }

      res.status(200).json({
          success: true,
          message: "All products are available"
      });
      
  } catch (error) {
      console.error('Product availability check error:', error);
      res.status(500).json({
          success: false,
          message: "Error checking product availability",
          error: error.message
      });
  }
};



const verifyPayment = async (req, res) => {
  try {
    const orderId =req.params.id;

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body

    // Fetch the order to get the Razorpay order details
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex')

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" })
    }

    order.paymentStatus = 'Paid'
    order.razorpayPaymentId = razorpay_payment_id
    await order.save()

    res.json({ success: true, message: "Payment verified successfully" })
  } catch (error) {
    console.error("Payment verification error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
}
const handleFailedOrder = async (req, res) => {
  try {
    const { orderId } = req.params
    const { status } = req.body

    const order = await Order.findByIdAndUpdate(
      orderId, 
      { 
        paymentStatus: status || 'Failed',
        status: 'Cancelled' 
      }, 
      { new: true }
    )

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    res.json({ success: true, message: "Order status updated" })
  } catch (error) {
    console.error("Failed order handling error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
}




const getOrderedProductDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await Order.findById(orderId)
      .populate("user", "firstName email")
      .populate({
        path: 'products.product',
        select: 'name images description price',
      })
      .populate('shippingAddress')
      console.log('order status',order.orderStatus);
      
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

return res.status(200).json({
      success: true,
      message: "Order details retrieved successfully",
      order: {
        _id: order._id,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        user: order.user,
        shippingAddress: order.shippingAddress,
        products: order.products.map(item => ({
          _id: item._id,
          quantity: item.quantity,
          price: item.price,
          productName: item.productName,
          productImage: item.productImage,
          returnStatus:item.returnReq.requestStatus,
          productDescription: item.productDescription,productName: item.product?.name,
          productImage: item.product?.images,
          productDescription: item.product?.description,
          product: item.product
        }))
      }
    });

  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order details"
    });
  }
};
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const orders = await Order.find({ user: userId })
    .populate('user', 'firstName email')
    .populate({
      path: 'products.product', 
      select: 'name images description price',
    })
    .populate('shippingAddress') 
    .sort({ createdAt: -1 });
  console.log(JSON.stringify(orders, null, 2));
  

    return res.status(200).json({
      success: true,
      message: "User orders retrieved successfully",
      orders: orders.map(order => ({
        _id: order._id,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        user: order.user,
        products: order.products.map(item => ({
          _id: item._id,
          quantity: item.quantity,
          price: item.price,
          productName: item.product?.name,
          productImage: item.product?.images,
          productDescription: item.product?.description,
          product: item.product
        }))
      }))
    });

  } catch (error) {
    console.error("Error fetching user orders:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user orders"
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('backend orderId', orderId);

    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (['DELIVERED', 'CANCELED'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled as it is already ${order.orderStatus.toLowerCase()}`
      });
    }

    // Calculate total refund amount from all products
    const refundAmount = order.products.reduce((total, product) => {
      return total + (product.productPaidAmount || 0);
    }, 0);

    // Update order status first
    order.orderStatus = 'CANCELED';
    order.cancelledAt = new Date();
    await order.save();

    // Find or create wallet for the user
    let wallet = await Wallet.findOne({ user: order.user });
    
    if (!wallet) {
      wallet = new Wallet({
        user: order.user,
        balance: refundAmount,
        transactions: []
      });
    } else {
      wallet.balance += refundAmount;
    }

    // Add refund transaction to wallet
    wallet.transactions.push({
      orderId: order._id,
      transactionType: 'credit',
      transactionDate: new Date(),
      transactionStatus: 'completed',
      amount: refundAmount
    });

    await wallet.save();
      
    return res.status(200).json({
      success: true,
      message: 'Order cancelled and refund processed successfully',
      order,
      refundAmount,
      walletBalance: wallet.balance
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};


module.exports = { cancelOrder };

module.exports = {
  placeOrderList,getOrderedProductDetails,getUserOrders,verifyPayment,handleFailedOrder,checkProductAvailability,cancelOrder,returnReqest
};
