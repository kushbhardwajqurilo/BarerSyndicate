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
const SubCatRouter = express.Router();
// SubCatRouter.use(AuthMiddleWare)
SubCatRouter.get("/getsubcat", getSubCat);
SubCatRouter.post("/addsubcat", addSubCat);
SubCatRouter.get("/getsinglesubcat/:id", singleSubCat);
SubCatRouter.delete("/deletesubcat/:id", deleteSubCat);
SubCatRouter.put("/updatesubcat/:_id", updateSubCat);
SubCatRouter.get("/aggregate/:id", aggregate);
SubCatRouter.get("/searchSubCategory", searchSubCategory);
// SubCatRouter.get("/getSubcategory");
module.exports = SubCatRouter;
