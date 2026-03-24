const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRoutes = require("./src/routes/userRouter");
const CategoryRouter = require("./src/routes/categoryRoute");
const adminRouter = require("./src/routes/adminRoute");
const ProductsRouter = require("./src/routes/productsRoute");
const enquiryRouter = require("./src/routes/enquaryRoute");
const brandRouter = require("./src/routes/brandRouter");
const SubCatRouter = require("./src/routes/subcategory.route");
const bannerRouter = require("./src/routes/banner.routes");
const OrderPlaceRouter = require("./src/routes/order.route");

const app = express();

/* ================= MIDDLEWARES ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ================= CORS (ALLOW ALL ORIGINS) ================= */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://git-branch-m-main.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
// test

/* ================= ROUTES ================= */
const baseURL = "/api/v1/";

app.use(`${baseURL}user`, userRoutes);
app.use(`${baseURL}admin`, adminRouter);
app.use(`${baseURL}category`, CategoryRouter);
app.use(`${baseURL}subcategory`, SubCatRouter);
app.use(`${baseURL}product`, ProductsRouter);
app.use(`${baseURL}enquiry`, enquiryRouter);
app.use(`${baseURL}brands`, brandRouter);
app.use(`${baseURL}banner`, bannerRouter);
app.use(`${baseURL}order`, OrderPlaceRouter);

/* ================= GLOBAL ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error("ERROR:", err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
