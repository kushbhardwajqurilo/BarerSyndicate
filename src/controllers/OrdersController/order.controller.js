const { default: mongoose } = require("mongoose");
const productModel = require("../../models/productModel");
const enquaryModel = require("../../models/enquaryModel");
const PlaceOrder = require("../../models/placeOrderModel");

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
    const userEnquarys = await enquaryModel
      .find({
        _id: { $in: equiry_id },
        user_id,
      })
      .populate({
        path: "productId",
        select: "name images variants",
      })
      .lean();
    if (!userEnquarys) {
      return res.status(400).json({
        status: false,
        message: "Eqnuiry Not found",
      });
    }
    const formatedData = userEnquarys.map((val, pos) => {
      return {
        orderId: `BS${Date.now()}${Math.floor(Math.random() * 1000)}`,
        userId: user_id,
        product: {
          productId: val.productId._id,
          name: val.productId.name,
          image: val.productId.images[0],
          variants: [...val.productId.variants],
        },
      };
    });

    const order = await PlaceOrder.insertMany(formatedData);
    if (!order) {
      return res.status(400).json({
        status: false,
        message: "Order Place Failed Try Again Later",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Order placed successfully",
    });
  } catch (error) {
    next(error);
  }
};
