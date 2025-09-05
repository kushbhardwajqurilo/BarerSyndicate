const { default: mongoose } = require("mongoose");
const categoryModel = require("../../models/categoryModel");
const fs = require("fs");
const cloudinary = require("../../config/cloudinary/cloudinary");

exports.createCategory = async (req, res, next) => {
  try {
    const file = req.file.path;
    if (!file) {
      return res.status(400).json({ message: "Please upload a file" });
    }
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        message: "Please enter a category name",
      });
    }
    const isCategory = await categoryModel.findOne({ categoryname: name });
    if (isCategory) {
      return res
        .status(200)
        .json({ success: false, message: "This category already exist" });
    }
    const upload = await cloudinary.uploader.upload(file, {
      folder: "BS-category-image",
    });
    if (!upload) {
      return res.status(400).json({ message: "Failed to upload image" });
    }
    fs.unlinkSync(file);
    const payload = {
      categoryname: name,
      catImg: upload.secure_url,
    };
    const category = await categoryModel.create(payload);
    if (!category) {
      return res.status(400).json({
        message: "Category not created",
      });
    }
    res.status(201).json({
      message: "Category created successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      success: false,
    });
  }
};

// update category
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "category id missing" });
    }
    if (!name || typeof name !== "string") {
      return res
        .status(200)
        .json({ success: false, message: "Inavlid Name Data Type" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(200)
        .json({ success: false, message: "Category id Not ObjectId" });
    }
    const objid = new mongoose.Types.ObjectId(id);
    const category = await categoryModel.findByIdAndUpdate(
      objid,
      { categoryname: name },
      {
        new: true,
      }
    );
    if (!category) {
      return res.status(400).json({
        message: "Category not updated",
      });
    }
    res.status(200).json({
      message: "Category updated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      success: false,
    });
  }
};

// delete category
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const catId = new mongoose.Types.ObjectId(id);
    if (!id) {
      return res.status(400).json({
        message: "Invalid id",
      });
    }
    const category = await categoryModel.findByIdAndDelete(catId);
    if (!category) {
      return res.status(400).json({
        message: "Category found",
      });
    }
    res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      success: false,
    });
  }
};

// get all category

exports.getAllCategory = async (req, res, next) => {
  try {
    const category = await categoryModel.find({});
    if (!category) {
      return res.status(404).json({
        message: "No categories found",
      });
    }
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// get single category
exports.getSingleCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const catId = new mongoose.Types.ObjectId(id);
    if (!id) {
      return res.status(400).json({
        message: "Invalid id",
      });
    }
    const singleCategory = await categoryModel.findById(catId);
    if (!singleCategory) {
      return res.status(404).json({
        message: "Category not found",
        success: false,
      });
    }
    res.status(200).json({
      success: true,
      data: singleCategory,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// search category
exports.searchCategory = async (req, res, next) => {
  try {
    const search = req.query;
    const query = {
      categoryname: { $regex: `^${search.search}`, $options: "i" },
    };
    const category = await categoryModel.find(query);
    if (category.length === 0) {
      return res.status(404).json({
        success: false,
        message: "category not found.",
      });
    }
    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
