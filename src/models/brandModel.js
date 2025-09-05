const mongoose = require("mongoose");
const brandSchema = new mongoose.Schema({
  brand: {
    type: String,
  },
});

module.exports = mongoose.model("brand", brandSchema);
