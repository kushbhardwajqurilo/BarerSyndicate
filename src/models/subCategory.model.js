const mongoose = require("mongoose");

const SubCategorySchema = new mongoose.Schema({
  subCatName: { type: String, required: true, unique: true },
  subCatTitle: {
    type: String,
    required: [true, "category title missing"],
  },
  catId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "category",
    required: [true, "category id missing"],
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("subcategory", SubCategorySchema);
