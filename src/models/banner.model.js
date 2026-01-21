const mongoose = require("mongoose");
const bannerSchema = mongoose.Schema(
  {
    banner: {
      type: String,
      required: [true, "Banner Image Requried"],
    },
    path_key: {
      type: String,
      required: [true, "Path Key Required"],
    },
  },
  { timestamps: true },
);
const bannerModel = mongoose.model("banner", bannerSchema);
module.exports = bannerModel;
