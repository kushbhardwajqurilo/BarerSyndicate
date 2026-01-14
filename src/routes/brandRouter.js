const {
  addBrands,
  getBrands,
  editBrand,
  brandsCategory,
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
  addBrands
);
brandRouter.get(
  "/getall",
  adminAuthentication,
  roleAuthetication("admin", "user"),
  getBrands
);
brandRouter.put(
  "/:id",
  adminAuthentication,
  roleAuthetication("admin"),
  ImageUpload.single("file"),
  editBrand
);
brandRouter.get("/get-brand-category", brandsCategory);
module.exports = brandRouter;
