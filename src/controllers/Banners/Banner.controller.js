const cloudinary = require("../../config/cloudinary/cloudinary");
const fs = require("fs");
const bannerModel = require("../../models/banner.model");
const { default: mongoose } = require("mongoose");
exports.addBanners = async (req, res, next) => {
  const { files } = req;
  const { type, title } = req.body;
  let insetData = [];
  for (let file of files) {
    const upload = await cloudinary.uploader.upload(file.path, {
      folder: "Barber_Syndicate_Banners",
    });
    if (upload) {
      insetData.push({
        banner: upload.secure_url,
        path_key: upload.public_id,
        type,
        title: title,
      });
    } else {
      return res.json({ status: false, message: "Unable to upload" });
    }
    fs.unlinkSync(file.path);
  }

  const bannerSave = await bannerModel.insertMany(insetData);
  if (!bannerSave) {
    return res.status(400).json({
      status: false,
      message: "Faile insert",
    });
  }
  return res.status(200).json({
    status: false,
    message: "Banner Upload SuccessFull",
  });
};

// get 4 latest banner for website
exports.getBannersForWebsite = async (req, res, next) => {
  const { type } = req.query;
  const filter = {};
  if (type && ["mobile", "website"].includes(type)) {
    filter.type = type; // ✅ correct
  }
  const banners = await bannerModel
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(4);
  if (!banners) {
    return res.status(200).json({
      status: false,
      message: "No Banners",
    });
  }
  return res.status(200).json({
    status: true,
    message: "Banner Fetched",
    banners,
  });
};

// get all banners for admin
exports.getAllBannersForAdmin = async (req, res, next) => {
  const { admin_id } = req;
  if (!admin_id) {
    return res.status(400).json({
      status: false,
      message: "Admin Id Missing",
    });
  }
  if (!mongoose.Types.ObjectId.isValid(admin_id)) {
    return res.status(400).json({
      status: false,
      message: "Invalid Admin Credentials",
    });
  }
  const banners = await bannerModel.find({}).sort({ createdAt: -1 });
  if (!banners) {
    return res.status(200).json({
      status: true,
      message: "No Banners Found",
    });
  }
  const filteredBanner = banners.map((val, index) => {
    return {
      _id: val._id,
      banner: val.banner,
      type: val.type,
      title: val.type,
    };
  });
  return res.status(200).json({
    status: true,
    message: "Success",
    data: filteredBanner,
  });
};
exports.deleteBanner = async (req, res, next) => {
  const { b_id } = req.query;
  if (!b_id) {
    return res.status(400).json({
      status: false,
      message: "banne id missing",
    });
  }
  if (!mongoose.Types.ObjectId.isValid(b_id)) {
    return res.status(400).json({
      status: false,
      message: "Invalid Banner Id",
    });
  }
  const banner = await bannerModel.findById(b_id);
  if (!banner) {
    return res.status(400).json({
      status: false,
      message: "Banner not found",
    });
  }
  const delete_from_cloud = await cloudinary.uploader.destroy(banner.path_key);
  if (delete_from_cloud.result === "ok") {
    await bannerModel.findByIdAndDelete(b_id);
    return res.status(201).json({
      status: true,
      message: "Banner Delete successfull",
    });
  } else {
    return res.status(400).json({
      status: false,
      message: "Unable to  delete banner",
    });
  }
};
