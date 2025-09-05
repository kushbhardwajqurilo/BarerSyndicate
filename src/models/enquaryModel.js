const mongoose = require("mongoose");
const COLLECTIONS = require("../database/Collection");
const variantSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  quantity: { type: String, required: true },
});
const enquarySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "user id rquired"],
    ref: "user",
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "product id rquired"],
    ref: "Product",
  },
  variants: { type: [variantSchema], required: [true] },
  AddedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model(COLLECTIONS.enquary, enquarySchema);
