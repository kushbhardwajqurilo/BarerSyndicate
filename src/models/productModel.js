const mongoose = require("mongoose");

// Schema for product variants
const variantSchema = new mongoose.Schema({
  price: { type: String, required: true },
  quantity: { type: String, required: true },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
      default: "",
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },

    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "subcategory",
    },

    variants: {
      type: [variantSchema],
      default: [],
    },

    description: {
      type: String,
    },

    isFeature: {
      type: Boolean,
      default: true,
    },

    key_feature: {
      type: String,
      trim: true,
      default: "",
    },

    //  SEARCH KEYWORDS
    keywords: {
      type: [String],
      default: [],
      set: (values) => values.map((v) => v.toLowerCase().trim()),
    },

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

// TEXT SEARCH INDEX (only ONE text index allowed)
productSchema.index(
  {
    name: "text",
    brand: "text",
    key_feature: "text",
    keywords: "text",
  },
  {
    weights: {
      name: 10,
      keywords: 8,
      brand: 5,
      key_feature: 3,
    },
    name: "ProductTextSearchIndex",
  },
);

module.exports = mongoose.model("Product", productSchema);
