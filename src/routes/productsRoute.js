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
  deleteProductPrice,
  addNewVariants,
  addNewImageInProduct,
  getNewArrivalProduct,
  getProductVariantList,
} = require("../controllers/productsController/productController");
const { adminAuthentication } = require("../middlewares/AdminAuthetication");
const ImageUpload = require("../middlewares/ImageUploader");
const { roleAuthetication } = require("../middlewares/roleBaseAuthe");

const ProductsRouter = require("express").Router();
ProductsRouter.put("/active-deactive", activeAndDeactivateProductController);

ProductsRouter.post(
  "/",
  adminAuthentication,
  roleAuthetication("admin"),
  ImageUpload.array("image", 7),
  createProduct,
);
ProductsRouter.delete(
  "/delete-price",
  adminAuthentication,
  roleAuthetication("admin"),
  deleteProductPrice,
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

ProductsRouter.get("/search-product", searchProducts);
ProductsRouter.post(
  "/add-variants/:id",
  adminAuthentication,
  roleAuthetication("admin"),
  addNewVariants,
);
ProductsRouter.post(
  "/add-image/:id",
  adminAuthentication,
  roleAuthetication("admin"),
  ImageUpload.array("image", 7),
  addNewImageInProduct,
);

ProductsRouter.get("/get-variants/:p_id", getProductVariantList);
ProductsRouter.get("/new-arrival", getNewArrivalProduct);
module.exports = ProductsRouter;
