const { default: mongoose } = require("mongoose");
const ProductModel = require("../../models/productModel");
const cloudinary = require("../../config/cloudinary/cloudinary");
const fs = require("fs");
const productModel = require("../../models/productModel");
exports.createProduct = async (req, res, next) => {
  try {
    const files = req.files;
    let {
      name,
      description,
      categoryId,
      subcategoryId,
      points,
      variants,
      isFeature,
      brand,
      key_feature,
    } = req.body;
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
      subcategoryId,
      images,
      points,
      variants,
      isFeature,
      brand,
      key_feature,
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
    const { category, subcategory, brand } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    let filter = {
      isActivate: true,
    };
    if (subcategory) filter.subcategoryId = subcategory;
    if (brand) filter.brand = brand;
    if (category) filter.categoryId = category;
    const products = await ProductModel.find(filter)
      .populate({
        path: "subcategoryId",
        select: "subCatName",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProducts = await ProductModel.countDocuments(filter);

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
// exports.updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     let { positions } = req.body;
//     /* ---------------- VALIDATE PRODUCT ID ---------------- */
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid product ID" });
//     }

//     const product = await ProductModel.findById(id);
//     if (!product) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     }

//     /* ===================== HELPERS ===================== */

//     const cleanString = (val) => {
//       if (typeof val !== "string") return val;
//       return val.replace(/"/g, "").replace(/,+$/, "").trim();
//     };

//     const cleanObjectId = (val) => {
//       if (!val) return undefined;
//       val = cleanString(val);
//       return mongoose.Types.ObjectId.isValid(val) ? val : undefined;
//     };

//     const safeJsonParse = (val, fallback) => {
//       try {
//         if (typeof val !== "string") return val;
//         return JSON.parse(val.replace(/,+$/, ""));
//       } catch {
//         return fallback;
//       }
//     };

//     /* ===================== UPDATE NORMAL FIELDS ===================== */

//     const {
//       name,
//       categoryId,
//       subcategoryId,
//       description,
//       brand,
//       points,
//       variants,
//     } = req.body;

//     if (name) product.name = cleanString(name);

//     const catId = cleanObjectId(categoryId);
//     if (catId) product.categoryId = catId;

//     const subCatId = cleanObjectId(subcategoryId);
//     if (subCatId) product.subcategoryId = subCatId;

//     const brandId = cleanObjectId(brand);
//     if (brandId) product.brand = brandId;

//     if (description) product.description = cleanString(description);

//     if (points) {
//       product.points = safeJsonParse(points, []);
//       product.markModified("points");
//     }

//     if (variants) {
//       const incomingVariants = safeJsonParse(variants, []);

//       const mergedVariants = product.variants.map((oldVar, index) => {
//         const newVar = incomingVariants[index];
//         if (!newVar) return oldVar;

//         return {
//           ...oldVar.toObject(),
//           ...newVar,
//           quantity:
//             newVar.quantity !== undefined ? newVar.quantity : oldVar.quantity, // 🔥 keep old quantity
//         };
//       });

//       product.variants = mergedVariants;
//       product.markModified("variants");
//     }

//     /* ===================== IMAGES (OPTIONAL) ===================== */

//     if (req.files && req.files.length > 0) {
//       // positions REQUIRED only when files exist
//       if (!positions) {
//         return res.status(400).json({
//           success: false,
//           message: "positions is required when updating images",
//         });
//       }

//       if (typeof positions === "string") {
//         positions = JSON.parse(positions);
//       }

//       if (!Array.isArray(positions)) {
//         return res.status(400).json({
//           success: false,
//           message: "positions must be an array",
//         });
//       }

//       const updatedIndexes = [];

//       for (let i = 0; i < req.files.length; i++) {
//         const file = req.files[i];
//         const imgIndex = Number(positions[i]);

//         if (
//           Number.isNaN(imgIndex) ||
//           imgIndex < 0 ||
//           imgIndex >= product.images.length
//         ) {
//           fs.unlinkSync(file.path);
//           continue;
//         }

//         const uploadResult = await cloudinary.uploader.upload(file.path, {
//           folder: "BS Products",
//         });

//         fs.unlinkSync(file.path);

//         product.images.set(imgIndex, uploadResult.secure_url);
//         updatedIndexes.push(imgIndex);
//       }

//       product.markModified("images");

//       await product.save();

//       return res.status(200).json({
//         success: true,
//         message: "Product updated successfully (with images)",
//         updatedIndexes,
//         data: product,
//       });
//     }

//     /* ===================== SAVE (NO IMAGES) ===================== */

//     await product.save();

//     return res.status(200).json({
//       success: true,
//       message: "Product updated successfully",
//       data: product,
//     });
//   } catch (error) {
//     console.error("Update Product Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let { positions } = req.body;

    /* ================= VALIDATE PRODUCT ID ================= */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    console.log("product", product);
    /* ===================== HELPERS ===================== */

    const cleanString = (val) => {
      if (typeof val !== "string") return val;
      return val.replace(/"/g, "").replace(/,+$/, "").trim();
    };

    const cleanObjectId = (val) => {
      if (!val) return undefined;
      val = cleanString(val);
      return mongoose.Types.ObjectId.isValid(val) ? val : undefined;
    };

    const safeJsonParse = (val, fallback) => {
      try {
        if (typeof val !== "string") return val;
        return JSON.parse(val.replace(/,+$/, ""));
      } catch {
        return fallback;
      }
    };

    /* ================= UPDATE NORMAL FIELDS ================= */

    const {
      name,
      categoryId,
      subcategoryId,
      description,
      brand,
      points,
      variants,
      key_feature,
      isFeature,
    } = req.body;
    if (name) product.name = cleanString(name);

    const catId = cleanObjectId(categoryId);
    if (catId) product.categoryId = catId;

    const subCatId = cleanObjectId(subcategoryId);
    if (subCatId) product.subcategoryId = subCatId;

    const brandId = cleanObjectId(brand);
    if (brandId) product.brand = brandId;

    if (description) product.description = cleanString(description);
    if (key_feature) product.key_feature = cleanString(key_feature);
    if (isFeature) product.isFeature = cleanString(isFeature);
    if (points) {
      product.points = safeJsonParse(points, []);
      product.markModified("points");
    }

    /* ================= VARIANTS (FULL REPLACE) ================= */

    /* ================= VARIANTS (FULL REPLACE - AS IT IS) ================= */

    if (variants !== undefined) {
      const incomingVariants = safeJsonParse(variants, []);

      if (!Array.isArray(incomingVariants)) {
        return res.status(400).json({
          success: false,
          message: "variants must be an array",
        });
      }

      // 🔥 AS IT IS SAVE, OLD REMOVE, NEW ADD
      product.variants = incomingVariants;
      product.markModified("variants");
    }
    console.log("update", product);
    /* ================= IMAGES (OPTIONAL) ================= */

    if (req.files && req.files.length > 0) {
      if (!positions) {
        return res.status(400).json({
          success: false,
          message: "positions is required when updating images",
        });
      }

      if (typeof positions === "string") {
        positions = JSON.parse(positions);
      }

      if (!Array.isArray(positions)) {
        return res.status(400).json({
          success: false,
          message: "positions must be an array",
        });
      }
      const updatedIndexes = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imgIndex = Number(positions[i]);

        if (
          Number.isNaN(imgIndex) ||
          imgIndex < 0 ||
          imgIndex >= product.images.length
        ) {
          fs.unlinkSync(file.path);
          continue;
        }

        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: "BS Products",
        });

        fs.unlinkSync(file.path);

        product.images.set(imgIndex, uploadResult.secure_url);
        updatedIndexes.push(imgIndex);
      }

      product.markModified("images");

      await product.save();

      return res.status(200).json({
        success: true,
        message: "Product updated successfully (with images)",
        updatedIndexes,
        data: product,
      });
    }

    /* ================= SAVE (NO IMAGES) ================= */

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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
    return res.status(200).json({
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
exports.featuredProducts = async (req, res) => {
  const DAYS = 7;
  const LIMIT = 5;

  const products = await productModel
    .find({
      isFeature: true,
      isActivate: true,
      createdAt: {
        $gte: new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000),
      },
    })
    .sort({ createdAt: -1 })
    .limit(LIMIT);

  res.status(200).json({
    status: true,
    data: products,
  });
};

// active / deactive product
// exports.activeAndDeactivateProductController = async (req, res, next) => {
//   const { id } = req.params;
//   const { status } = req.body;

//   if (!id) {
//     return res
//       .status(400)
//       .json({ status: false, message: "product id missing" });
//   }
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({
//       status: false,
//       message: "Invalid Project ObjectId",
//     });
//   }
//   if (!["activate", "deactivate"].includes(status)) {
//     return res.status(400).json({
//       status: false,
//       message: "Status must be activate or deactivate",
//     });
//   }

//   const product = await productModel.findOne({ _id: id });
//   if (!product) {
//     return res.status(400).json({
//       status: false,
//       message: "product not found",
//     });
//   }
//   if (status === "deactivate") {
//     product.isActivate = false;
//     await product.save();
//     return res.status(200).json({
//       success: true,
//       message: "product deactivated.",
//     });
//   }
//   if (status === "activate") {
//     product.isActivate = true;
//     await product.save();
//     return res.status(200).json({
//       success: true,
//       message: "product activated.",
//     });
//   }
//   return res.status(400).json({
//     status: false,
//     message: "Try Again later.",
//   });
// };

// seacrh product

exports.searchProducts = async (req, res) => {
  try {
    const {
      search, // keyword for name + description
      page = 1,
    } = req.query;

    const query = {};

    /* ---------------- NAME + DESCRIPTION SEARCH ---------------- */
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    /* ---------------- PAGINATION ---------------- */
    const skip = (Number(page) - 1) * 20;

    const [products, total] = await Promise.all([
      ProductModel.find(query)
        .skip(skip)
        .limit(Number(20))
        .sort({ createdAt: -1 }),

      ProductModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      limit: 20,
      results: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Search Products Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//  delete product price
exports.deleteProductPrice = async (req, res, next) => {
  try {
    console.log("sss");
    const { p_id, position } = req.query;
    console.log("query", req.query);
    if (!position) {
      return res.status(400).json({
        status: false,
        message: "Variant Postion Requried",
      });
    }

    const products = await ProductModel.findOne({ _id: p_id });
    if (!products) {
      return res.status(400).json({
        status: false,
        message: "Product not found try again later",
      });
    }
    if (!Array.isArray(products.variants) || products.variants.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Variants not found try again later",
        variants: [],
      });
    }
    const index = Number(position);
    if (position < 0 || index >= products.variants.length) {
      return res.status(400).json({
        status: false,
        message: "Invalid Varinat Position",
      });
    }

    products.variants.splice(index, 1);
    await products.save();
    return res.status(201).json({
      status: true,
      message: "Price delete successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Something Went Wrong",
      error: error.message,
    });
  }
};

exports.addNewVariants = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { variants } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id",
      });
    }

    //  Validate variants array
    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "variants must be a non-empty array",
      });
    }

    //  Find product
    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    //  Clean & validate variants
    const cleanedVariants = variants.map((v, index) => {
      if (!v.price || !v.quantity) {
        throw new Error(`price and quantity required at index ${index}`);
      }

      return {
        price: String(v.price).trim(),
        quantity: String(v.quantity).trim(),
      };
    });

    //  Push only into variants
    product.variants.push(...cleanedVariants);
    product.markModified("variants");

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Variants added successfully",
      data: product.variants,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// add image in product
exports.addNewImageInProduct = async (req, res) => {
  try {
    const { id } = req.params;

    /* ---------- VALIDATION ---------- */
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Product Id Missing",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Product Id",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Image Required",
      });
    }

    const product = await productModel.findById(id);
    if (!product) {
      req.files.forEach((file) => {
        fs.existsSync(file.path) && fs.unlinkSync(file.path);
      });

      return res.status(404).json({
        status: false,
        message: "Product not found",
      });
    }

    /* ---------- UPLOAD IMAGES ---------- */
    const uploadedImages = [];

    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "BS Products",
      });

      uploadedImages.push(result.secure_url);
      fs.unlinkSync(file.path);
    }

    /* ---------- SAVE ---------- */
    product.images.push(...uploadedImages);
    await product.save();

    return res.status(200).json({
      status: true,
      message: "Product images added successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// new arrival product
exports.getNewArrivalProduct = async (req, res, next) => {
  const last7days = new Date();
  last7days.setDate(last7days.getDate() - 7);

  const products = await productModel
    .find({ createdAt: { $gte: last7days } })
    .sort({ createdAt: -1 })
    .select("-__v -createdAt -updatedAt")
    .lean();

  return res.status(200).json({
    status: false,
    message: "New Arrival Product Fetch",
    data: products,
  });
};

exports.activeAndDeactivateProductController = async (req, res, next) => {
  const { id, status } = req.body;
  if (!id || (Array.isArray(id) && id.length === 0)) {
    return res.status(400).json({
      status: false,
      message: "Product id missing",
    });
  }
  // Convert single id → array
  const ids = Array.isArray(id) ? id : [id];

  // Validate ObjectIds
  for (const productId of ids) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Product ObjectId",
      });
    }
  }
  if (![true, false].includes(status)) {
    return res.status(400).json({
      status: false,
      message: "Status must be activate or deactivate",
    });
  }
  const product = await productModel.updateMany(
    { _id: { $in: id } },
    { $set: { isActivate: status } },
  );

  if (product.modifiedCount === 0) {
    return res.status(400).json({
      status: false,
      message: "failed to active/deactive produt",
    });
  }
  return res.status(200).json({
    status: false,
    message: status
      ? "product activate successfull"
      : "product deactivate successfull",
  });
};

// get product variants list
exports.getProductVariantList = async (req, res, next) => {
  const { p_id } = req.params;
  if (!p_id) {
    return res.status(400).json({
      status: false,
      message: "product id missing",
    });
  }
  if (!mongoose.Types.ObjectId.isValid(p_id)) {
    return res.status(400).json({
      status: false,
      message: "Invalid Product-id",
    });
  }

  const variants_list = await ProductModel.findOne({ _id: p_id }).select(
    "variants",
  );
  if (!variants_list) {
    return res.status(400).json({
      status: false,
      message: "variants not found",
    });
  }
  return res.status(200).json({
    status: true,
    message: "success",
    data: [...variants_list.variants],
  });
};
