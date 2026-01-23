const {
  addBanners,
  deleteBanner,
  getAllBannersForAdmin,
  getBannersForWebsite,
} = require("../controllers/Banners/Banner.controller");
const { adminAuthentication } = require("../middlewares/AdminAuthetication");
const ImageUpload = require("../middlewares/ImageUploader");
const { roleAuthetication } = require("../middlewares/roleBaseAuthe");

const bannerRouter = require("express").Router();

bannerRouter.post(
  "/add-banner",
  adminAuthentication,
  roleAuthetication("admin"),
  ImageUpload.array("file", 4),
  addBanners,
);
bannerRouter.get(
  "/all",
  adminAuthentication,
  roleAuthetication("admin"),
  getAllBannersForAdmin,
);
bannerRouter.delete(
  "/delete-banner",
  adminAuthentication,
  roleAuthetication("admin"),
  deleteBanner,
);
bannerRouter.get("/banner-for-ui", getBannersForWebsite);
module.exports = bannerRouter;
