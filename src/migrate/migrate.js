require("dotenv").config();
const mongoose = require("mongoose");
const productModel = require("../models/productModel");
const brandModel = require("../models/brandModel");

async function migrateBrands() {
  try {
    // connect to db first
    mongoose
      .connect(process.env.DB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(
        (res) => {
          console.log("database connected");
        },
        (fail) => {
          console.log("databse not connected");
        }
      )
      .catch((err) => {
        console.log("err", err);
      });
    const products = await productModel.find({});
    for (const product of products) {
      const oldBrands = product.brand;
      if (!oldBrands) continue;
      let brandDoc = await brandModel.findOne({ brand: oldBrands });
      if (!brandDoc) {
        brandDoc = await brandModel.create({ brand: oldBrands });
      }
      product.brand = brandDoc._id;
      await product.save();
      console.log(`migrate product:${product.name} -> ${oldBrands}`);
    }
    console.log("migration compelete");
  } catch (err) {
    console.error(" Migration failed:", err);
    process.exit(1);
  }
}

migrateBrands();
