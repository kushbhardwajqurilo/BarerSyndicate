const {
  addBrands,
  getBrands,
  editBrand,
  brandsCategory,
  deleteBrand,
} = require("../controllers/Brands/BrandController");
const { adminAuthentication } = require("../middlewares/AdminAuthetication");
const ImageUpload = require("../middlewares/ImageUploader");
const { roleAuthetication } = require("../middlewares/roleBaseAuthe");

const brandRouter = require("express").Router();
brandRouter.post(
  "/",
  adminAuthentication,
  roleAuthetication("admin"),
  ImageUpload.single("file"),
  addBrands,
);
brandRouter.get("/getall", getBrands);
brandRouter.put(
  "/:id",
  adminAuthentication,
  roleAuthetication("admin"),
  ImageUpload.single("file"),
  editBrand,
);
brandRouter.get("/get-brand-category", brandsCategory);
brandRouter.delete(
  "/delete-brand",
  adminAuthentication,
  roleAuthetication("admin"),
  deleteBrand,
);
module.exports = brandRouter;
