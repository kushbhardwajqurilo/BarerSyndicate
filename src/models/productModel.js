const mongoose = require("mongoose");
// Schema for product variants
const variantSchema = new mongoose.Schema({
  price: { type: String, required: true, min: 1 },
  quantity: { type: String, required: true, min: 1 },
});
const productSchema = new mongoose.Schema(
  {
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
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "subcategory is required"],
      ref: "subcategory",
    },
    variants: { type: [variantSchema], default: [] },
    description: {
      type: String,
    },
    isFeature: {
      type: Boolean,
      default: true,
    },
    key_feature: { type: String, default: "" },
    images: {
      type: [String],
      default: [],
    },
    points: {
      type: [String],
      default: [],
    },
    isActivate: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
