const {
  userSignup,
  getSingleUser,
  userLogin,
  forgetUserPassword,
  verifyOTPS,
  testOtp,
  testOtpVerify,
  changePassword,
  getUserList,
} = require("../controllers/userController/userController");
const { adminAuthentication } = require("../middlewares/AdminAuthetication");
const {
  forgetPasswordAuth,
} = require("../middlewares/forgetPasswordMiddleware");
const { userAuthMiddleware } = require("../middlewares/userAuthMiddleware");

const userRoutes = require("express").Router();
userRoutes.post("/singup", userSignup);
userRoutes.get("/single-user/:id", getSingleUser);
userRoutes.post("/login", userLogin);
userRoutes.post("/forget-password", forgetUserPassword);
userRoutes.post("/verify", verifyOTPS);
userRoutes.post("/change-password", forgetPasswordAuth, changePassword);
userRoutes.post("/otp-send", testOtp);
userRoutes.post("/verify-otp", testOtpVerify);
userRoutes.get("/all-users", adminAuthentication, getUserList);

module.exports = userRoutes;
