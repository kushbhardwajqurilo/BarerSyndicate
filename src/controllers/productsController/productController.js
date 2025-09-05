const { default: mongoose } = require("mongoose");
const ProductModel = require("../../models/productModel");
const cloudinary = require("../../config/cloudinary/cloudinary");
const fs = require("fs");
exports.createProduct = async (req, res, next) => {
  try {
    const files = req.files;

    // Require at least 5 images
    if (!files || files.length < 5) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload at least 5 images" });
    }

    let { name, description, categoryId, points, variants, isFeature, brand } =
      req.body;
    // Validate required fields
    if (!name || !description || !categoryId || !brand) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all required fields" });
    }
    // Utility: safe JSON.parse with fallback
    const safeParse = (val, fallback) => {
      if (!val) return fallback;
      try {
        return JSON.parse(val);
      } catch (e) {
        return fallback;
      }
    };

    // Parse variants (array of objects required)
    variants =
      typeof variants === "string" ? safeParse(variants, []) : variants;
    if (!Array.isArray(variants)) {
      return res.status(400).json({
        success: false,
        message: "Variants must be a valid array",
      });
    }
    if (variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one variant is required",
      });
    }

    // Parse points (array of strings, optional)
    points = typeof points === "string" ? safeParse(points, []) : points;
    if (!Array.isArray(points)) {
      return res.status(400).json({
        success: false,
        message: "Points must be an array of strings",
      });
    }

    // Upload images to Cloudinary (uncomment when ready)
    const images = [];
    for (const file of files) {
      const uploadCloud = await cloudinary.uploader.upload(file.path, {
        folder: "BS Products",
      });
      images.push(uploadCloud.secure_url);
      fs.unlinkSync(file.path);
    }

    // Build payload
    const payload = {
      name,
      description,
      categoryId,
      images,
      points,
      variants,
      isFeature,
      brand,
    };
    // Save product in DB
    const product = await ProductModel.create(payload);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: "failed to  add product",
      });
    }
    return res.status(201).json({
      message: "Product add successfully",
      success: true,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: err.message, success: false, error: err });
  }
};

// get all products
exports.getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const products = await ProductModel.find({}).skip(skip).limit(limit);

    const totalProducts = await ProductModel.countDocuments();

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found", success: false });
    }

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      totalResults: totalProducts,
      products,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false, err });
  }
};

// get single products
exports.getSingleProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }
    res.status(200).json({ product, success: true });
  } catch (err) {
    return res.status(400).json({ message: err.message, success: false });
  }
};

// update product

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const { name, description, categoryId, variants, brand, points } = req.body;

    // Basic validation
    if (!name || !description || !categoryId) {
      return res
        .status(400)
        .json({ message: "Please fill all the required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }

    if (brand && !mongoose.Types.ObjectId.isValid(brand)) {
      return res.status(400).json({ message: "Invalid brand ID" });
    }

    // Validate variants (if provided)
    if (variants && !Array.isArray(variants)) {
      return res.status(400).json({ message: "Variants must be an array" });
    }

    if (variants) {
      for (const variant of variants) {
        if (!variant.price || !variant.quantity) {
          return res
            .status(400)
            .json({ message: "Each variant must have price and quantity" });
        }
      }
    }

    // Validate points (if provided)
    if (points && !Array.isArray(points)) {
      return res
        .status(400)
        .json({ message: "Points must be an array of strings" });
    }

    const payload = {
      name,
      description,
      categoryId,
      brand,
      variants,
      points,
    };

    // Remove undefined fields (so partial update works cleanly)
    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key]
    );

    const product = await ProductModel.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "product update successfull" });
  } catch (err) {
    return res.status(500).json({ message: err.message, success: false });
  }
};

// delete products
exports.deleteProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const productId = new mongoose.Types.ObjectId(id);
    const product = await ProductModel.findByIdAndDelete(productId);
    if (!product) {
      return res
        .status(400)
        .json({ message: "Product not found", success: false });
    }
    return res.status(500).json({
      success: true,
      message: "peroduct delete",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// similor product
exports.similarProduct = async (req, res, next) => {
  try {
    const pageNo = Number(req.query.pageno);
    const id = req.body.id || req.query.id || 0; // allow flexibility
    if (!id || !pageNo) {
      return res
        .status(400)
        .json({ status: "success", message: "Missing id or pageno" });
    }

    const limit = 5;
    const catId = new mongoose.Types.ObjectId(id);

    const totalCount = await ProductModel.countDocuments({ categoryId: catId });
    const totalPage = Math.ceil(totalCount / limit);

    if (pageNo <= totalPage) {
      const offset = (pageNo - 1) * limit;
      const getProduct = await ProductModel.find({ categoryId: catId })
        .skip(offset)
        .limit(limit);

      return res.json({
        status: "success",
        message: "Products fetched successfully",
        data: getProduct,
        pages: totalPage,
      });
    } else {
      return res.json({
        status: "fail",
        message: "Page number exceeds available pages",
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Unable to find products",
      error: err.message,
    });
  }
};

// featuered products
exports.featuredProducts = async (req, res, next) => {
  try {
    const featuered = await ProductModel.find({ isFeature: true }).select(
      "-__v"
    );
    if (!featuered) {
      return res.status(404).json({
        success: false,
        message: "failed to fetch...",
      });
    }
    return res.status(200).json({
      success: true,
      data: featuered,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
