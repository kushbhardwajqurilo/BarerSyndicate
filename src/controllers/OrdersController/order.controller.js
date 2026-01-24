const { default: mongoose } = require("mongoose");
const productModel = require("../../models/productModel");
const enquaryModel = require("../../models/enquaryModel");
const PlaceOrder = require("../../models/placeOrderModel");

exports.orderPlaceController = async (req, res, next) => {
  try {
    const { user_id, enquiry_id } = req.body;

    /* ================= VALIDATIONS ================= */

    if (!enquiry_id || !Array.isArray(enquiry_id) || enquiry_id.length === 0) {
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

    for (let id of enquiry_id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          status: false,
          message: `Invalid Enquiry Id: ${id}`,
        });
      }
    }

    /* ================= FETCH ENQUIRIES ================= */

    const userEnquarys = await enquaryModel
      .find({
        _id: { $in: enquiry_id },
        user_id,
      })
      .populate({
        path: "productId",
        select: "name images variants",
      })
      .lean();

    if (!userEnquarys || userEnquarys.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Enquiry not found",
      });
    }

    /* ================= FETCH EXISTING ORDERS ================= */

    const existingOrders = await PlaceOrder.find(
      { userId: user_id },
      { "product.productId": 1 },
    ).lean();

    const existingProductIds = new Set(
      existingOrders.map((o) => o.product.productId.toString()),
    );

    /* ================= FILTER NEW PRODUCTS ================= */

    const formatedData = userEnquarys
      .filter((val) => !existingProductIds.has(val.productId._id.toString()))
      .map((val) => ({
        orderId: `BS${Date.now()}${Math.floor(Math.random() * 1000)}`,
        userId: user_id,
        product: {
          productId: val.productId._id,
          name: val.productId.name,
          image: val.productId.images?.[0] || null,
          variants: val.productId.variants || [],
        },
      }));

    if (formatedData.length === 0) {
      return res.status(200).json({
        status: false,
        message: "All selected products are already ordered",
      });
    }

    /* ================= PLACE ORDER ================= */

    await PlaceOrder.insertMany(formatedData);

    return res.status(200).json({
      status: true,
      message: "Order placed successfully",
      addedProducts: formatedData.length,
      skippedProducts: userEnquarys.length - formatedData.length,
    });
  } catch (error) {
    next(error);
  }
};

// <---------- get order list to user -------------->
exports.userOrderList = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "user id missing",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid User ID",
      });
    }

    const orders = await PlaceOrder.find({ userId: id })
      .sort({ createdAt: -1 })
      .lean();

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        status: true,
        message: "Orders Not Available",
        data: [],
        total: 0,
      });
    }

    let total = 0;

    orders.forEach((order) => {
      if (order.status === "cancel") return;

      const variants = order?.product?.variants || [];
      variants.forEach((v) => {
        total += Number(v.price || 0);
      });
    });

    const data = orders.map((val) => ({
      _id: val?._id,
      productName: val?.product?.name,
      variants: val?.product?.variants || [],
      status: val?.status,
    }));

    return res.status(200).json({
      status: true,
      message: "Orders fetched successfully",
      total, // ✅ cancel wala include nahi hoga
      data,
    });
  } catch (error) {
    next(error);
  }
};

// <----------- Order list for admin -------------->
exports.OrderListOfAdmin = async (req, res, next) => {
  const { admin_id } = req;
  if (!admin_id) {
    return res.status(400).json({
      status: false,
      message: "admin Id missing",
    });
  }
  if (!mongoose.Types.ObjectId.isValid(admin_id)) {
    return res.status(400).json({
      stauts: false,
      message: "Invaid Admin Id",
    });
  }
  const orders = await PlaceOrder.find({})
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();

  if (!orders) {
    return res.status(200).json({
      stauts: true,
      message: "orders not available",
      data: [],
    });
  }
  return res.status(200).json({
    status: true,
    message: "orders found",
    data: orders,
  });
};

// <------ order confirm, canel  and delete ---------->
exports.orderApprovedOrReject = async (req, res, next) => {
  try {
    const { admin_id } = req;
    const { id, type } = req.params;

    // ---------- ADMIN VALIDATION ----------
    if (!admin_id) {
      return res.status(400).json({
        status: false,
        message: "Admin id missing",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(admin_id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Admin Id",
      });
    }

    // ---------- ORDER ID VALIDATION ----------
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Order id missing",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid Order Id",
      });
    }

    // ---------- TYPE VALIDATION ----------
    if (!["approved", "reject"].includes(type)) {
      return res.status(400).json({
        status: false,
        message: "Invalid action type",
      });
    }

    // ---------- UPDATE ORDER ----------
    const order = await PlaceOrder.findOneAndUpdate(
      { _id: id },
      { $set: { status: type } },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({
        status: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      status: true,
      message: `Order ${type} successfully`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
// pdf order data for admin
exports.orderPdf = async (req, res, next) => {};
