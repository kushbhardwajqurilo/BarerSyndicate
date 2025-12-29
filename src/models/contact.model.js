const mongoose = require("mongoose");
const contactSchema = mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    required: true,
    unique: true,
  },
});

const contactModel = new mongoose.model("contact", contactSchema);
module.exports = contactModel;
