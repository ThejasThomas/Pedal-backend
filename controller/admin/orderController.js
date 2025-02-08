const express = require("express");
const Order = require("../../model/orderModel");
const User = require("../../model/userModel");
const Wallet=require('../../model/walletModel')
const updateOrderStatus = async (req, res) => {
  try {
    
    
    const { orderId } = req.params;
    const { status } = req.body;
    // console.log('orderid',req.params);
    // console.log('status',req.body);
    
    

    // const validStatuses = ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    // if (!validStatuses.includes(status)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid order status",
    //   });
    // }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "user",
          as: "orders",
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          orderCount: { $size: "$orders" },
        },
      },
    ]);
    // console.log("users", users);

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const orders = await Order.find({})
      .populate("user", "firstName email")
      .populate({
        path: "products.product",
        select: "name images description price",
      })
      .populate("shippingAddress")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
      const totalOrders = await Order.countDocuments();


    return res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      orders: orders.map((order) => ({
        _id: order._id,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        user: order.user,
        products: order.products.map((item) => ({
          _id: item._id,
          quantity: item.quantity,
          price: item.price,
          originalPrice:item.originalPrice,
          couponDiscount:item.couponDiscount,
          discountType:item.discountType,
          discountAmount:item.discountAmount,
          appliedDiscount:item.appliedDiscount, 
          requestStatus:item.returnReq.requestStatus,
          explanation:item.returnReq.explanation,
          reason:item.returnReq.reason,
          productName: item.product?.name,
          productImage: item.product?.images,
          productDescription: item.product?.description,
          product: item.product,
          
        })),
      })),
      totalOrders,
      totalPages:Math.ceil(totalOrders/limit)

    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};
const updateReturnResponse = async (req, res) => {
  try {
    const { orderId, productId, status } = req.body;
    
    const productIdToCompare = typeof productId === 'object' ? productId._id : productId;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const productIndex = order.products.findIndex(
      (item) => item.product.toString() === productIdToCompare.toString()
    );
    
    console.log('Comparing:', {
      orderProductId: order.products[0].product.toString(),
      requestedProductId: productIdToCompare
    });

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in order"
      });
    }

    order.products[productIndex].returnReq = {
      ...order.products[productIndex].returnReq,
      requestStatus: status
    };

    await order.save();

     if (status === "Accepted") {
      const userId = order.user;
      const productPaidAmount = order.products[productIndex].productPaidAmount;

      let wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        wallet = new Wallet({ user: userId, balance: 0, transactions: [] });
      }

      wallet.balance += productPaidAmount;

      wallet.transactions.push({
        orderId: order._id,
        transactionType: "credit",
        transactionDate: new Date(),
        transactionStatus: "completed",
        amount: productPaidAmount,
      });

      await wallet.save();
    }

    return res.status(200).json({
      success: true,
      message: `Return request ${status.toLowerCase()}`,
      order,
    });
  } catch (error) {
    console.error("Error updating return request:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update return request status",
    });
  }
};
module.exports = { updateOrderStatus, getAllOrders, getAllUsers,updateReturnResponse };
