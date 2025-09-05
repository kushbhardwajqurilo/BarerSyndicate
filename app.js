const express = require("express");
const cors = require("cors");
const app = express();
const cookie = require("cookie-parser");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookie());
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const {
  userSignup,
} = require("./src/controllers/userController/userController");
const userRoutes = require("./src/routes/userRouter");
const cloudinary = require("./src/config/cloudinary/cloudinary");
const ImageUpload = require("./src/middlewares/ImageUploader");
const CategoryRouter = require("./src/routes/categoryRoute");
const adminRouter = require("./src/routes/adminRoute");
const ProductsRouter = require("./src/routes/productsRoute");
const enquiryRouter = require("./src/routes/enquaryRoute");
const brandRouter = require("./src/routes/brandRouter");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./public/upload"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });
const baseURL = "/api/v1/";
app.use(`${baseURL}user`, userRoutes);
app.use(`${baseURL}admin`, adminRouter);
app.use(`${baseURL}category`, CategoryRouter);
app.use(`${baseURL}product`, ProductsRouter);
app.use(`${baseURL}enquiry`, enquiryRouter);
app.use(`${baseURL}brands`, brandRouter);

// otp with twilio testing
const otpStoreTest = {};

module.exports = app;
