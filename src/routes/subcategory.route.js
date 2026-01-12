const express = require("express");
const {
  getSubCat,
  addSubCat,
  singleSubCat,
  deleteSubCat,
  updateSubCat,
  aggregate,
  searchSubCategory,
} = require("../controllers/categoryController.js/subCategory");
const { adminAuthentication } = require("../middlewares/AdminAuthetication");
const { roleAuthetication } = require("../middlewares/roleBaseAuthe");
const ImageUpload = require("../middlewares/ImageUploader");
const SubCatRouter = express.Router();
// SubCatRouter.use(AuthMiddleWare)
SubCatRouter.get("/getsubcat", getSubCat);
SubCatRouter.post(
  "/addsubcat",
  adminAuthentication,
  roleAuthetication("admin"),
  ImageUpload.single("image"),
  addSubCat
);
SubCatRouter.get("/getsinglesubcat/:id", singleSubCat);
SubCatRouter.delete("/deletesubcat/:id", deleteSubCat);
SubCatRouter.put("/updatesubcat/:_id", updateSubCat);
SubCatRouter.get("/aggregate/:id", aggregate);
SubCatRouter.get("/searchSubCategory", searchSubCategory);
// SubCatRouter.get("/getSubcategory");
SubCatRouter.get("/subcategorybycategory", getSubCat);
module.exports = SubCatRouter;
