const {
  orderPlaceController,
} = require("../controllers/OrdersController/order.controller");

const OrderPlaceRouter = require("express").Router();

OrderPlaceRouter.post("/place-order", orderPlaceController);
module.exports = OrderPlaceRouter;
