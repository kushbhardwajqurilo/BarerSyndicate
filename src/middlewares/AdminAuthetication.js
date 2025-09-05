require("dotenv").config({});
const jwt = require("jsonwebtoken");
exports.adminAuthentication = async (req, res, next) => {
  try {
    const Addmintoken = req.headers;
    if (!Addmintoken?.authorization) {
      return res
        .status(404)
        .json({ success: false, message: "Authenorization failed" });
    }
    const token = Addmintoken.authorization.split(" ")[1];

    const adminInfo = jwt.verify(token, process.env.secretKey);

    if (adminInfo) {
      req.admin_id = adminInfo.id;
      req.role = adminInfo.role;
      next();
    } else {
      res.json({
        status: "failed",
        message: "Invalid token",
      });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Authentication failed", error: err.messge });
  }
};
