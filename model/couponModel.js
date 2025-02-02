const mongoose=require('mongoose')
const { trim } = require('validator')
const coupon_schema =new mongoose.Schema({
    code:{
        type:String,
        required:true,
        trim:true,
        uppercase:true,
    },
    discountValue:{
        type:Number,
        required:true,
        min:[0,'Discount value cannot be negative']
    },
    minPurchaseAmount:{
        type:Number,
        default:null,
        min:[0,"Minimum purchase amount cannot be negative"],

    },
    maxDiscountAmount:{
        type:Number,
        default:null,
        min: [0, "Maximum discount amount cannot be negative"],
    },
    expirationDate:{
        type:Date,
        required:true
    },
    // usageLimit:{
    //     type:Number,
    //     default:1,
    //     min: [1, "Usage limit must be at least 1 if specified"],
    // },
    // currentUsageLimit:{
    //     type:Number,
    //     default:0,
    // }
})

module.exports =mongoose.model('coupon',coupon_schema)