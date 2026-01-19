const {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  similarProduct,
  featuredProducts,
  activeAndDeactivateProductController,
  searchProducts,
} = require("../controllers/productsController/productController");
const { adminAuthentication } = require("../middlewares/AdminAuthetication");
const ImageUpload = require("../middlewares/ImageUploader");
const { roleAuthetication } = require("../middlewares/roleBaseAuthe");

const ProductsRouter = require("express").Router();
ProductsRouter.post(
  "/",
  adminAuthentication,
  roleAuthetication("admin"),
  ImageUpload.array("image", 7),
  createProduct,
);
ProductsRouter.get("/", getAllProducts);
ProductsRouter.get("/single/:id", getSingleProduct);
ProductsRouter.put(
  "/:id",
  adminAuthentication,
  roleAuthetication("admin"),
  ImageUpload.array("image", 7),
  updateProduct,
);
ProductsRouter.delete(
  "/:id",
  adminAuthentication,
  roleAuthetication("admin"),
  deleteProduct,
);
ProductsRouter.get("/similar", similarProduct);
ProductsRouter.get("/feature", featuredProducts);
ProductsRouter.put(
  "/active-deactive/:id",
  activeAndDeactivateProductController,
);

ProductsRouter.get("/search-product", searchProducts);
module.exports = ProductsRouter;
