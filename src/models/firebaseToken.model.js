const mongoose = require("mongoose");
const fcmTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "user id required"],
    },
    fcm_token: { type: String, required: [true, "fcm token required."] },
  },
  {
    timestamps: true,
  },
);
const fcmTokenModel = mongoose.model("fcm_token", fcmTokenSchema);
module.exports = fcmTokenModel;
