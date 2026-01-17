const mongoose = require("mongoose");
const brandSchema = new mongoose.Schema({
  brand: {
    type: String,
  },
  icons: {
    type: String,
    default: "icon.png",
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    required: [true, "category required"],
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "subcategory",
    required: [true, "subcategory"],
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("brand", brandSchema);
