const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  basePrice: {
    type: Number,
    required: true,
  },
  offer: {
    type:mongoose.Schema.Types.ObjectId,
    ref:"Offer",
},
  quantity: {
    type: Number,
    required: true,
  }, // required: true,
  // category: {
  //  type: mongoose.Schema.Types.ObjectId,
  //  ref: 'Category',
  // },
  category: {
    type: String,
    required: true,  // Make it required if needed
  },
   discountedAmount:{
       type:Number,
       min:0,
       default:undefined
   },
  catOfferval:{
    type:Number,
    default:undefined,
  },
  productOffval:{
    type:Number,
    default:undefined
  },
  tags: [
    {
      type: String, // Array of tags
    },
  ],
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived','Unpublished'],
    default: 'Draft',
  },
  images: { type: [String], required: true },
  // rating: {
  //   type: Number,
  //   min: 0,
  //   max: 5,
  //   default: 0,
  // },
  // id: {
  //   type: String,
  //   // Will be set to _id when saving
  // },
 createdAt: {
    type: Date,
    default: Date.now,
  },
},{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
productSchema.virtual('currentPrice').get(function() {
  const discountAmount = (this.basePrice * this.discount) / 100;
  return this.basePrice - discountAmount;
});

productSchema.methods.calculateCurrentPrice = function() {
  return this.currentPrice;
};
productSchema.pre('save', async function(next) {
  try {
      if (!this.productOffval && !this.catOfferval) {
          this.discountValue = undefined;
          this.discountedAmount = undefined;
          return next();
      }

      const productOffer = this.productOffval ? Number(this.productOffval) : 0;
      const categoryOffer = this.catOfferval ? Number(this.catOfferval) : 0;

      const highestDiscount = Math.max(productOffer, categoryOffer);

      if (highestDiscount <= 0) {
          this.discountValue = undefined;
          this.discountedAmount = undefined;
          return next();
      }

      this.discountValue = highestDiscount;
      const discountAmount = (this.basePrice * highestDiscount) / 100;
      this.discountedAmount = Math.round(discountAmount * 100) / 100;

      next();
  } catch (error) {
      next(error);
  }
});

module.exports = mongoose.model('Product', productSchema);
