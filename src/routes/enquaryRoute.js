const {
  addToEquary,
  getAllEnquary,
  getSingleEnquary,
  getAllEnquaryToAdmin,
  deleteEnquary,
  removeVariantsFromEnquiry,
} = require("../controllers/AddToEnquary/addEnquarycontroller");
const { adminAuthentication } = require("../middlewares/AdminAuthetication");
const { roleAuthetication } = require("../middlewares/roleBaseAuthe");
const { userAuthMiddleware } = require("../middlewares/userAuthMiddleware");

const enquiryRouter = require("express").Router();
enquiryRouter.post("/", addToEquary);
enquiryRouter.get("/single/:id", getSingleEnquary);
enquiryRouter.get("/all", adminAuthentication, getAllEnquaryToAdmin);
enquiryRouter.get("/:id", getAllEnquary);
enquiryRouter.delete("/:id", deleteEnquary);
enquiryRouter.put(
  "/remove",
  userAuthMiddleware,
  roleAuthetication("user"),
  removeVariantsFromEnquiry,
);
module.exports = enquiryRouter;
