const jwt = require("jsonwebtoken");
exports.userAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized user" });
    }
    const user = jwt.verify(token, process.env.customerKey);
    if (!user) {
      return res.status(401).json({ message: "verfication failed" });
    }
    req.user_id = user._id;
    next();
  } catch (err) {
    res.status(401).json({ message: err.message, success: false });
  }
};
