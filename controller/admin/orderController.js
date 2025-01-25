const express =require('express')
const Order =require('../../model/orderModel')
const User=require('../../model/userModel')


const updateOrderStatus = async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
  
      const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status"
        });
      }
  
      const order = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus: status },
        { new: true }
      );
  
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to update order status"
      });
    }
  };
  const getAllUsers = async (req, res) => {
    try {
      const users = await User.aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'user',
            as: 'orders'
          }
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            orderCount: { $size: '$orders' }
          }
        }
      ]);
      console.log('users',users);
      
  
      res.status(200).json({
        success: true,
        users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message
      });
    }
  };
  const getAllOrders = async (req, res) => {
    try {
      const orders = await Order.find({})
        .populate('user', 'firstName email')
        .populate({
          path: 'products.product',
          select: 'name images description price',
        })
        .populate('shippingAddress')
        .sort({ createdAt: -1 });
  
      return res.status(200).json({
        success: true,
        message: "Orders retrieved successfully",
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
      console.error("Error fetching all orders:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch orders"
      });
    }
  };
  module.exports ={updateOrderStatus,getAllOrders,getAllUsers}