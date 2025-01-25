const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false
  },
 user: {
     type: mongoose.Schema.Types.ObjectId,
     ref:'User',
     required: true,
   },
}, {
  timestamps: true  
});

module.exports =mongoose.model("Address", addressSchema);