const mongoose =require('mongoose')

const walletSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    balance:{
        type:Number,
        required:true,
        default:0,

    },
    transactions:[
        {
            orderId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Order',
            },
            transactionType:{
                type:String,
                enum:['debit','credit'],
                required:true,
            },
            transactionDate:{
                type:Date,
                required:true,
            },
            transactionStatus:{
                type:String,
                enum:["pending", "completed", "failed"],
                required:true
            },
            amount:{
                type:Number,
                required:true,
            },
            
        }
    ]
})

module.exports = mongoose.model("Wallet",walletSchema)