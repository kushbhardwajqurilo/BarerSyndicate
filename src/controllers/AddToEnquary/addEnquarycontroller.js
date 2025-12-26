const { default: mongoose, mongo } = require("mongoose");
const userModel = require("../../models/userModel");
const productModel = require("../../models/productModel");
const enquaryModel = require("../../models/enquaryModel");

// add enquary for user
exports.addToEquary = async (req, res) => {
  try {
    let { productId, id, variants } = req.body;

    if (!id) {
      return res
        .status(200)
        .json({ success: false, message: "User id missing" });
    }
    if (!productId) {
      return res
        .status(200)
        .json({ success: false, message: "Product id missing" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(200)
        .json({ success: false, message: "User id must be ObjectId" });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(200)
        .json({ success: false, message: "Product id must be ObjectId" });
    }

    const safeParse = (val, fallback) => {
      if (!val) return fallback;
      try {
        return JSON.parse(val);
      } catch (e) {
        return fallback;
      }
    };

    variants =
      typeof variants === "string" ? safeParse(variants, []) : variants;

    if (!Array.isArray(variants)) {
      return res.status(400).json({
        success: false,
        message: "Variants should be a valid array",
      });
    }
    if (variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one variant is required",
      });
    }

    variants = variants.map((v) => ({
      price: Number(v.price),
      quantity: v.quantity,
    }));

    // validate negative or NaN
    for (let v of variants) {
      if (isNaN(v.price) || v.price <= 0) {
        return res.status(400).json({
          success: false,
          message: "Price and quantity must be valid positive numbers",
        });
      }
    }

    const isUser = await userModel.findById(id);
    if (!isUser) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const isProduct = await productModel.findById(productId);
    if (!isProduct) {
      return res
        .status(400)
        .json({ success: false, message: "Product not found" });
    }

    //  Check if enquiry already exists
    let alreadyProduct = await enquaryModel.findOne({
      user_id: id,
      productId,
    });

    if (alreadyProduct) {
      //  Merge variants (add price if variant with same quantity exists, else push new)
      variants.forEach((newVar) => {
        let existing = alreadyProduct.variants.find(
          (v) => v.quantity === newVar.quantity
        );
        if (existing) {
          // same variant (by quantity) → add price
          existing.price += newVar.price;
        } else {
          // new variant → push
          alreadyProduct.variants.push(newVar);
        }
      });

      await alreadyProduct.save();

      return res.status(200).json({
        success: true,
        message: "Enquiry updated with new variants",
        data: alreadyProduct,
      });
    }

    // First time enquiry → create new
    await enquaryModel.create({
      user_id: id,
      productId,
      variants,
    });

    return res.status(200).json({ success: true, message: "Enquiry added..." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

// get all enquary to each user
exports.getAllEnquary = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(200).json({
        success: false,
        message: "User id required",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(200).json({
        success: false,
        message: "User id must be Object ID",
      });
    }
    const isUser = await userModel.findById(id);
    if (!isUser) {
      return res.status(400).json({
        success: false,
        message: "Invalid User",
      });
    }
    const Enquary = await enquaryModel
      .find({ user_id: id })
      .populate("productId", "-__v -variants")
      .populate("user_id", "-password -__v ");
    if (!Enquary || Enquary.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User Enquary not exist",
      });
    }
    const totalPrice = Enquary.reduce((sum, product) => {
      const variantSum = product.variants.reduce(
        (vSum, v) => vSum + v.price,
        0
      );
      return sum + variantSum;
    }, 0);
    console.log("total", totalPrice);
    return res.status(200).json({
      success: true,
      data: Enquary,
      total: totalPrice,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message, error });
  }
};

// delete enquary
exports.deleteEnquary = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Enquary id required",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Enquary id must be ObjectId",
      });
    }

    const enquary = await enquaryModel.findByIdAndDelete(id);
    if (!enquary) {
      return res.status(404).json({
        success: false,
        message: "Enquary not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Enquary deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

//get single enquary
exports.getSingleEnquary = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(200).json({
        success: false,
        message: "enquary id required and id must be objectId",
      });
    }
    const isEqnuary = await enquaryModel
      .findById(id)
      .populate("user_id", "-password -__v -status ")
      .populate("productId", "-variants");
    if (!isEqnuary) {
      return res.status(400).json({
        success: false,
        message: "enquary not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: isEqnuary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

// get all enquary to admin
exports.getAllEnquaryToAdmin = async (req, res) => {
  try {
    const enquiries = await enquaryModel
      .find({})
      .populate("productId", "-__v")
      .populate("user_id", "-password -__v -status");

    if (!enquiries || enquiries.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No enquiries found",
      });
    }

    return res.status(200).json({
      success: true,
      data: enquiries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
