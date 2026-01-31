const {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategory,
  getSingleCategory,
  searchCategory,
  updateCategoryImage,
} = require("../controllers/categoryController.js/category");
const { adminAuthentication } = require("../middlewares/AdminAuthetication");
const ImageUpload = require("../middlewares/ImageUploader");
const { roleAuthetication } = require("../middlewares/roleBaseAuthe");

const CategoryRouter = require("express").Router();
CategoryRouter.get("/search_cate", searchCategory);
CategoryRouter.post(
  "/",
  adminAuthentication,
  roleAuthetication("admin"),
  ImageUpload.single("image"),
  createCategory
);
CategoryRouter.put(
  "/:id",
  adminAuthentication,
  roleAuthetication("admin"),
  updateCategory
);
CategoryRouter.delete(
  "/:id",
  adminAuthentication,
  roleAuthetication("admin"),
  deleteCategory
);
CategoryRouter.get("/", getAllCategory);
CategoryRouter.get("/:id", getSingleCategory);
CategoryRouter.post(
  "/update-image/:id",
  adminAuthentication,
  roleAuthetication("admin"),
  ImageUpload.single("image"),
  updateCategoryImage
);
module.exports = CategoryRouter;
