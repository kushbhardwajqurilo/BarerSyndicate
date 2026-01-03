const { default: mongoose } = require("mongoose");
const cloudinary = require("../../config/cloudinary/cloudinary");
const brandModel = require("../../models/brandModel");
const fs = require("fs");
exports.addBrands = async (req, res) => {
  try {
    const file = req.file;
    if (!file || file.length === 0) {
      return res
        .status(400)
        .json({ status: 400, message: "Brand Icons Missing" });
    }
    const requiredFiled = ["name", "category", "subcategory"];
    for (let fields of requiredFiled) {
      if (!req.body[fields] || req.body[fields].toString().length === 0) {
        return res
          .status(400)
          .json({ status: false, message: `${fields} required ` });
      }
    }
    const { name, category, subcategory } = req.body;

    const icon_upload = await cloudinary.uploader.upload(file.path, {
      folder: "BRAND_ICONS",
    });
    if (!icon_upload) {
      fs.unlinkSync(file.path);
    }
    fs.unlinkSync(file.path);
    const insertBrand = await brandModel.create({
      brand: name,
      subcategory: subcategory,
      category: category,
      icons: icon_upload.secure_url,
    });
    if (!insertBrand) {
      return res.status(400).json({
        success: false,
        message: "Failed to add brand",
      });
    }

    return res
      .status(201)
      .json({ success: true, message: "Brand add successfull" });
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: error.message, error });
  }
};

//  get all brands
exports.getBrands = async (req, res) => {
  try {
    const brands = await brandModel.find({});
    if (!brands || brands.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "no brands found.. try agian" });
    }
    return res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    console.log("err", error);
    return res
      .status(400)
      .json({ success: false, message: error.message, error });
  }
};

exports.editBrand = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { id } = req.params; // brand id
    console.log({ file: req.file, name, id });
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }
    console.log(mongoose.Types.ObjectId.isValid(id));
    const updateData = {
      brand: name,
    };

    if (req.file) {
      const upload = await cloudinary.uploader.upload(req.file.path, {
        folder: "BRAND_ICONS",
      });
      updateData.icons = upload.secure_url; // or req.file.filename
    }

    const updatedBrand = await brandModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedBrand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data: updatedBrand,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
