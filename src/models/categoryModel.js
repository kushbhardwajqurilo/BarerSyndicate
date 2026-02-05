const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categoryname: { type: String, required: true, unique: true },
  catImg: {
    type: String,
    required: [true, "category image missing"],
  },
});
categorySchema.index({ categoryname: 1 });
module.exports = mongoose.model("Category", categorySchema);
