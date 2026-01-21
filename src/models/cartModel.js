const mongoose = require("mongoose");
const placeOrder = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: [true],
  },
  product: {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: [true, "Product id is required"],
    },
    price: { type: Number, required: [true, "Product Price required"] },
    quantity: { type: String, required: [true, "Quantity required"] },
    image: { type: String, required: [true, "Product Image required"] },
  },
});
