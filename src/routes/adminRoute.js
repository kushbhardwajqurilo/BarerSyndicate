const {
  adminSignup,
  adminLogin,
  searchUser,
  approveUser,
  contactDetailsController,
  getContactDetailsController,
  updateContactDetails,
} = require("../controllers/AdminController/createAdminController");
const { adminAuthentication } = require("../middlewares/AdminAuthetication");
const { roleAuthetication } = require("../middlewares/roleBaseAuthe");

const adminRouter = require("express").Router();

adminRouter.post("/signup", adminSignup);
adminRouter.post("/login", adminLogin);
adminRouter.get("/search", searchUser);
adminRouter.put(
  "/approve/:userid",
  adminAuthentication,
  roleAuthetication("admin"),
  approveUser
);
adminRouter.post(
  "/contact",
  adminAuthentication,
  roleAuthetication("admin"),
  contactDetailsController
);
adminRouter.get("/contact", getContactDetailsController);
adminRouter.put("/contact-update", updateContactDetails);
module.exports = adminRouter;
