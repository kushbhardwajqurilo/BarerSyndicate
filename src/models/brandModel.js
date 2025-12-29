const mongoose = require("mongoose");
const brandSchema = new mongoose.Schema({
  brand: {
    type: String,
  },
  icons: {
    type: String,
    default: "icon.png",
  },
});

module.exports = mongoose.model("brand", brandSchema);
