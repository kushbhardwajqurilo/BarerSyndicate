const cloudinary = require("../../config/cloudinary/cloudinary");
const fs = require("fs");
const bannerModel = require("../../models/banner.model");
const { default: mongoose } = require("mongoose");

const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { deleteFileFromS3 } = require("../../config/aws/awsConfig");
exports.addBanners = async (req, res, next) => {
  const { file } = req.body;
  const { type, title, url, key } = req.body;
  const insetData = {
    banner: file,
    path_key: key,
    type,
    title: title,
    url,
  };

  const bannerSave = await bannerModel.create(insetData);
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
exports.deleteBanner = async (req, res) => {
  try {
    const { b_id } = req.query;

    if (!b_id) {
      return res.status(400).json({
        status: false,
        message: "Banner id missing",
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
      return res.status(404).json({
        status: false,
        message: "Banner not found",
      });
    }

    // banner.path_key should contain S3 object key
    // Example: banners/171922332-image.jpg
    const deleted = await deleteFileFromS3(banner.path_key);

    if (!deleted.success) {
      return res.status(400).json({
        status: false,
        message: "Unable to delete banner from S3",
      });
    }

    await bannerModel.findByIdAndDelete(b_id);

    return res.status(200).json({
      status: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Delete Banner Error:", error);

    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};
