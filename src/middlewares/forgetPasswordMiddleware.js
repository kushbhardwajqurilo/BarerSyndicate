const jwt = require("jsonwebtoken");

exports.forgetPasswordAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const user = jwt.verify(token, process.env.customerKey);

    req.phone = user.phone;
    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: " + error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
