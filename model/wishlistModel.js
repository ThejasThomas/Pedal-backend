const mongoose = require("mongoose")

const whishlistSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        items:[
            {
                productId:{
                    type:mongoose.Schema.Types.ObjectId,
                    ref:"Product",
                    required:true,
                },
            },
        ],
        
    },
    {
        timestamps:true
    }
)

module.exports = mongoose.model("Wishlist",whishlistSchema)