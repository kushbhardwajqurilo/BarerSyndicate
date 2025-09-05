const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  otp: { type: Number, default: 0 },
  otpExpire: { type: Date, default: "" },
});

module.exports = mongoose.model("Otp", otpSchema);
