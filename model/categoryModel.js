const mongoose =require('mongoose')

const categorySchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    images: [{ 
        type: String,
        required: true
    }],
    description:{
        type:String,
        required:true
    }, 
    cloudinaryId: { 
        type: String
    },
    isActive: {
         type: Boolean,
         default: true },
    isHidden: {
            type: Boolean,
            default: false
        },
    createdAt:{
        type:Date,
        default:Date.now,
    },
    updatedAt: {
        type: Date
    }
})

module.exports =mongoose.model('Category',categorySchema);