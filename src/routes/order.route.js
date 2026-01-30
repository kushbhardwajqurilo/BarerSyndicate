const {
  orderPlaceController,
  userOrderList,
  OrderListOfAdmin,
  orderApprovedOrReject,
  UserOrderDetails,
  SingleUserOrderDetails,
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
OrderPlaceRouter.post(
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
OrderPlaceRouter.get(
  "/single-order-details/:id",
  adminAuthentication,
  roleAuthetication("admin"),
  SingleUserOrderDetails,
);
module.exports = OrderPlaceRouter;
