const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, "Product Image Require For Notification"],
    },
    product_url: {
      type: String,
      required: [true, "product url req"],
    },
    product_name: {
      type: String,
      required: [true, "product name required"],
    },
    product_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
);

// correct index
NotificationSchema.index({ createdAt: -1 });

const NotificationModel = mongoose.model(
  "product_notification",
  NotificationSchema,
);

module.exports = NotificationModel;
