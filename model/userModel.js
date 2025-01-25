const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: function () {
      return this.googleId ? false : true;
    },
  },
  lastName: {
    type: String,
    required: function () {
      return this.googleId ? false : true;
    },
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: function () {
      return this.googleId ? false : true;
    },
  },
  phone: {
    type: String,
    required: function () {
      return this.googleId ? false : true;
    },
  },
  isAdmin: {
    type: Boolean,
    default: 0,
  },
  isBlocked: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  googleId: String,
});
const User = mongoose.model("user", userSchema);
module.exports = User;
