const {
  addBrands,
  getBrands,
} = require("../controllers/Brands/BrandController");

const brandRouter = require("express").Router();
brandRouter.post("/", addBrands);
brandRouter.get("/", getBrands);
module.exports = brandRouter;
