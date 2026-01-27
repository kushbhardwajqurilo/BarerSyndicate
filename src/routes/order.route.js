const {
  orderPlaceController,
  userOrderList,
  OrderListOfAdmin,
  orderApprovedOrReject,
  UserOrderDetails,
} = require("../controllers/OrdersController/order.controller");
const { adminAuthentication } = require("../middlewares/AdminAuthetication");
const { roleAuthetication } = require("../middlewares/roleBaseAuthe");
const { userAuthMiddleware } = require("../middlewares/userAuthMiddleware");

const OrderPlaceRouter = require("express").Router();

OrderPlaceRouter.post(
  "/place-order",
  userAuthMiddleware,
  roleAuthetication("user"),
  orderPlaceController,
);
// user orders  list
OrderPlaceRouter.get(
  "/user-orders/:id",
  userAuthMiddleware,
  roleAuthetication("user"),
  userOrderList,
);
OrderPlaceRouter.get(
  "/order-list",
  adminAuthentication,
  roleAuthetication("admin"),
  OrderListOfAdmin,
);
OrderPlaceRouter.get(
  "/confrim-order",
  adminAuthentication,
  roleAuthetication("admin"),
  orderApprovedOrReject,
);

OrderPlaceRouter.get(
  "/userlist",
  adminAuthentication,
  roleAuthetication("admin"),
  UserOrderDetails,
);
module.exports = OrderPlaceRouter;
