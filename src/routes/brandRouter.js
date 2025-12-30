const {
  addBrands,
  getBrands,
  editBrand,
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
  roleAuthetication("admin"),
  getBrands
);
brandRouter.put(
  "/:id",
  adminAuthentication,
  roleAuthetication("admin"),
  ImageUpload.single("file"),
  editBrand
);
module.exports = brandRouter;
