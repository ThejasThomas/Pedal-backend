const mongoose=require('mongoose')

const offerSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim: true
    },
    offerValue:{
        type:Number,
        required:true,
        min: 0
    },
    targetType:{
        type:String,
        enum:["product","category"],
        required:true,
    },
    targetId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref: function() {
            return this.targetType === "product" ? "Product" : "Category";
        }
    },
    targetName:{
        type:String,
        required:true,
    },
    endDate:{
        type:Date,
        validate: {
            validator: function(value) {
                return value > new Date();
            },
            message: "End date must be in the future"
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Offer",offerSchema)