const mongoose = require("mongoose");
// Schema for product variants
const variantSchema = new mongoose.Schema({
  price: { type: String, required: true, min: 1 },
  quantity: { type: String, required: true, min: 1 },
});
const productSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  brand: {
    type: String,
    default: "",
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "categoryId is required"],
    ref: "Category",
  },
  variants: { type: [variantSchema], default: [] },
  description: {
    type: String,
  },
  isFeature: {
    type: Boolean,
    default: false,
  },
  images: {
    type: [String],
    default: [],
  },
  points: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("Product", productSchema);
