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

const app = express();

/* ================= MIDDLEWARES ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ================= CORS (ALLOW ALL ORIGINS) ================= */
app.use(
  cors({
    origin: true, // allow all origins dynamically
    credentials: true, // allow cookies / auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);

/* ================= ROUTES ================= */
const baseURL = "/api/v1/";

app.use(`${baseURL}user`, userRoutes);
app.use(`${baseURL}admin`, adminRouter);
app.use(`${baseURL}category`, CategoryRouter);
app.use(`${baseURL}subcategory`, SubCatRouter);
app.use(`${baseURL}product`, ProductsRouter);
app.use(`${baseURL}enquiry`, enquiryRouter);
app.use(`${baseURL}brands`, brandRouter);

/* ================= GLOBAL ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error("ERROR:", err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
