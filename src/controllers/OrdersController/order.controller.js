const { default: mongoose } = require("mongoose");
const productModel = require("../../models/productModel");
const enquaryModel = require("../../models/enquaryModel");

exports.orderPlaceController = async (req, res, next) => {
  try {
    const { user_id, equiry_id } = req.body;

    /* ================= VALIDATIONS ================= */

    if (!equiry_id || !Array.isArray(equiry_id) || equiry_id.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Enquiry Ids array missing",
      });
    }

    if (!user_id) {
      return res.status(400).json({
        status: false,
        message: "User id missing",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid User Id",
      });
    }

    /* ================= VALIDATE EACH PRODUCT ID ================= */

    for (let id of equiry_id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          status: false,
          message: `Invalid Enquiry Id: ${id}`,
        });
      }
    }
    /* ================= FETCH Eqnuiry ================= */
    const userEnquarys = await enquaryModel.find({
      _id: { $in: equiry_id },
      user_id,
    });
    if (!userEnquarys) {
      return res.status(400).json({
        status: false,
        message: "Eqnuiry Not found",
      });
    }
    console.log("enquiry", userEnquarys);
    return res.status(200).json({
      status: true,
      message: "Order placed successfully",
    });
  } catch (error) {
    next(error);
  }
};
