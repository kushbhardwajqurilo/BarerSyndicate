const mongoose = require("mongoose");
const placeOrderSchema = new mongoose.Schema({
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
    name: { type: String, required: [true, "product name Required"] },
    variants: [
      {
        price: { type: String, required: [true, "Price Required"] },
        quantity: { type: String, required: [true, "qunatiy required"] },
      },
    ],
    image: { type: String, required: [true, "Product Image required"] },
  },
});
const PlaceOrder = mongoose.model("place_order", placeOrderSchema);
module.exports = PlaceOrder;
