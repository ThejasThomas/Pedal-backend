const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        productPaidAmount:{
          type:Number,
          required:true
        },
        price: {
          type: Number,
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        productImage: String,
        productDescription: String,
        originalPrice: {
          type: Number,
          required: true,
        },
        couponDiscount:{
          type:Number,
          required:true
        },
        paymentStatus:{
          type:String,
          // required:true,
          enum: ['Pending','Paid','Failed','Refunded'],
          default:'Pending'
        },
    
        appliedDiscount: Number,
        discountAmount: Number,
        discountType: {
          type: String,
          enum: ["Product Offer", "Category Offer", "No Offer"],
        },returnReq:{
                requestStatus:{
                    type:String,
                    enum:["Pending","Accepted","Rejected"],
                },
                reason:{
                    type:String,
                },
                explanation:{
                    type:String,
                }
             },
        productOfferValue: Number,
        categoryOfferValue: Number,
      },
      
      
    ],
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["CashOnDelivery", "UPI", "Razorpay"],
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ["PENDING", "CANCELED", "DELIVERED", "ON THE ROAD","FAILED"],
      default: "PENDING",
    },
    razorpayOrderId: {
      type: String,
      required: false,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
