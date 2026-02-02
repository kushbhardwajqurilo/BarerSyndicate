const { default: mongoose } = require("mongoose");
const productModel = require("../../models/productModel");
const enquaryModel = require("../../models/enquaryModel");
const PlaceOrder = require("../../models/placeOrderModel");
const userModel = require("../../models/userModel");

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

    // console.log("enquery", userEnquarys);
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
          variants: val.variants || [],
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
      date: val?.createdAt,
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
    console.log("body", req.body);
    const { admin_id } = req;
    const { id, type } = req.body;
    console.log("issss", id);
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
    if (!id || (Array.isArray(id) && id.length === 0)) {
      return res.status(400).json({
        status: false,
        message: "Product id missing",
      });
    }
    for (let ids of id) {
      if (!mongoose.Types.ObjectId.isValid(ids)) {
        return res.status(400).json({
          status: false,
          message: "Invalid Order Id",
        });
      }
    }

    // ---------- TYPE VALIDATION ----------
    if (!["approved", "cancel"].includes(type)) {
      return res.status(400).json({
        status: false,
        message: "Invalid action type",
      });
    }

    // ---------- UPDATE ORDER ----------
    const order = await PlaceOrder.updateMany(
      { _id: { $in: id } },
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
    });
  } catch (error) {
    next(error);
  }
};
// pdf order data for admin
exports.orderPdf = async (req, res, next) => {};

// order count and coustimer detils
exports.UserOrderDetails = async (req, res, next) => {
  try {
    // maan lo ye tumhara DB response hai
    const orders = await PlaceOrder.find({}).populate("userId");

    const usersMap = {};

    for (const order of orders) {
      const userId = order.userId._id.toString();

      // agar user map me nahi hai
      if (!usersMap[userId]) {
        usersMap[userId] = {
          userId: userId,
          name: order.userId.name,
          email: order.userId.email,
          orders: [],
        };
      }

      // order push karo
      usersMap[userId].orders.push({
        _id: order._id,
        orderId: order.orderId,
        product: order.product,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    }

    // object ko array me convert
    const result = Object.values(usersMap);
    const filterData = result?.map((val) => {
      return {
        userId: val.userId,
        name: val.name,
        email: val.email,
        total: val.orders.length,
      };
    });
    return res.status(200).json({
      success: true,
      totalUsers: result.length,
      data: filterData,
    });
  } catch (error) {
    next(error);
  }
};

// get single user order list
exports.SingleUserOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const orders = await PlaceOrder.find({
      userId: id, // 🔥 mongoose string ko khud ObjectId bana leta hai
    }).populate("userId");

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this user",
      });
    }

    const usersMap = {};

    for (const order of orders) {
      if (!order.userId) continue;

      const userId = order.userId._id.toString();

      if (!usersMap[userId]) {
        usersMap[userId] = {
          userId,
          name: order.userId.name,
          email: order.userId.email,
          addres: order.userId.address,
          phone: order.userId.phone,
          gst: order.userId.gstnumber,
          orders: [],
        };
      }

      usersMap[userId].orders.push({
        _id: order._id,
        orderId: order.orderId,
        product: order.product,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    }

    const result = Object.values(usersMap);

    return res.status(200).json({
      success: true,
      totalOrders: result[0].orders.length,
      data: result[0], // 👈 single user ka data
    });
  } catch (error) {
    next(error);
  }
};

exports.multipleOrderDelte = async (req, res, next) => {
  const { order_id } = req.body;
  if (!Array.isArray(order_id)) {
    return res.status(400).json({
      status: false,
      message: "Order id required",
    });
  }
  const o_id =
    order_id.length === 1
      ? [order_id[0]]
      : order_id.map((id) => {
          return new mongoose.Types.ObjectId(id);
        });

  const result = await PlaceOrder.deleteMany({ _id: { $in: o_id } });
  if (result.deletedCount === 0) {
    return res.status(400).json({
      status: false,
      message: "failed to delete",
    });
  }
  return res.status(201).json({
    status: true,
    message: `${result.deletedCount} orders delete`,
  });
};
