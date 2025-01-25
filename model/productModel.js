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
  discount: {
    type: Number,
    default: 0, // Percentage discount
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
  id: {
    type: String,
    // Will be set to _id when saving
  },
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

// Optional: Add a method to explicitly calculate current price
productSchema.methods.calculateCurrentPrice = function() {
  return this.currentPrice;
};

module.exports = mongoose.model('Product', productSchema);
