const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
      required: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => Date.now() + 10 * 60 * 1000,
    },
  },
  { timestamps: true },
  
);


module.exports = mongoose.model("Otp", otpSchema);
