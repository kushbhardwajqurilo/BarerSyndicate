const { default: mongoose } = require("mongoose");
const userModel = require("../../models/userModel");
const otpModel = require("../../models/otepModel");
const fs = require("fs");
const {
  hashPassword,
  compareHashPassword,
} = require("../../utitlies/hashyPassword");
const jwt = require("jsonwebtoken");
const { isValidGST } = require("../../utitlies/gstValidation");
const { genrateOTP } = require("../../utitlies/genrateOtp");
const { default: axios } = require("axios");
const cloudinary = require("../../config/cloudinary/cloudinary");
const otpStore = {};
const otpStoreTest = {};
exports.userSignup = async (req, res, next) => {
  const file = req.file;
  try {
    const validation = {
      name: "",
      email: "",
      password: "",
      address: "",
      gstnumber: "",
      phone: "",
    };
    const { name, email, password, address, gstnumber, phone } = req.body;

    for (let val of Object.keys(validation)) {
      if (!req.body[val] || req.body[val].length === 0) {
        return res.status(400).json({
          success: false,
          message: `${val} required`,
        });
      }
    }
    const gstTest = isValidGST(gstnumber);
    if (!gstTest) {
      return res.json({
        success: false,
        message: "Invalid GST Number",
      });
    }
    if (phone.length !== 10) {
      return res.json({
        success: false,
        message: "Phone number should be 10 digits",
      });
    }
    const uploadCloud = await cloudinary.uploader.upload(file.path, {
      folder: "BS_USER_IDENTIFICATION",
    });
    console.log(uploadCloud);
    fs.unlinkSync(file.path);
    const payload = {
      name,
      email,
      password: hashPassword(password),
      address,
      gstnumber,
      phone,
      idProof: uploadCloud.secure_url,
    };
    const user = await userModel.create(payload);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Faild to signup try again", success: false });
    }
    return res.status(200).json({
      message: "singup successfully admin will approve your profile.",
      success: true,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

//get single user
exports.getSingleUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//user login
exports.userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password missing" });
    }
    const isUser = await userModel.findOne({ email });
    if (!isUser) {
      return res.status(404).json({ message: "Email not register" });
    }
    const match = await compareHashPassword(password, isUser.password);
    if (match) {
      const token = jwt.sign({ id: isUser._id }, process.env.customerKey, {
        expiresIn: "7d",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      if (isUser) {
        if (isUser.status === "pending") {
          return res.status(200).json({
            success: true,
            message:
              "Your Profile is not approved by admin please wait for approval",
          });
        }
        return res.status(200).json({
          success: true,
          message: "login Success",
          aprroval: "aprroved",
          token,
          id: isUser._id,
        });
      } else {
        return res.status(400).json({ message: "invalid password" });
      }
    }
    return res.status(200).json({
      success: false,
      message: "Invalid password ",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//logout

exports.userLogout = async (req, res, next) => {
  try {
    res.clearCookie("token", {
      httpOnly: "true",
      secure: process.env.NODE_ENV === "production",
    });
    return res.status(200).json({ success: true, message: "logout Success" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//

// forget password

exports.forgetUserPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;

    // validate phone
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit phone number is required",
      });
    }

    // check if user exists
    const user = await userModel.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Phone number is not registered",
      });
    }

    // generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    // remove old OTP if exists
    await otpModel.deleteMany({ phone });

    // save new OTP in db
    await otpModel.create({
      phone,
      otp,
      otpExpire: otpExpiry,
    });

    // send OTP via SMS API
    const apiUrl = `https://sms.autobysms.com/app/smsapi/index.php?key=45FA150E7D83D8&campaign=0&routeid=9&type=text&contacts=${phone}&senderid=SMSSPT&msg=Your OTP is ${otp} SELECTIAL&template_id=1707166619134631839`;

    const response = await axios.get(apiUrl);
    if (response.data.type === "SUCCESS") {
      return res.status(200).json({
        success: true,
        message: "OTP sent successfully to registered number",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
        error: response.data,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
// verifyOtp then update

exports.verifyOTPS = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone, OTP, and new password are required",
      });
    }
    // OTP & expiry check
    const user = await otpModel.findOne({ phone });
    if (!user.otp || !user.otpExpire || Date.now() > user.otpExpire) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    if (Number(user.otp) !== Number(otp)) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }
    user.otp = null;
    user.otpExpire = null;
    await user.save();
    const token = jwt.sign({ phone }, process.env.customerKey, {
      expiresIn: "5m",
    });
    return res.status(200).json({
      success: true,
      message: "Otp Verified",
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// change password
exports.changePassword = async (req, res) => {
  try {
    const { phone } = req;
    const { password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }
    const isUser = await userModel.findOne({ phone });
    if (!isUser) {
      return res.status(404).json({
        success: false,
        message: "Password change failed: user does not exist.",
      });
    }
    const hasPass = await hashPassword(password);
    isUser.password = hasPass;
    await isUser.save();
    return res.status(200).json({
      success: true,
      message: "Password Change.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

exports.testOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const otp = genrateOTP();
    otpStore[phone] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    await twilioClient.messages.create({
      body: `your otp ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: `+91${phone}`,
    });
    return res.json({ messages: "Otp send successfully" });
  } catch (error) {
    return res.json({ error, message: error.message });
  }
};

exports.testOtpVerify = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (otpStoreTest[phone] && otpStoreTest[phone] == otp) {
      delete otpStoreTest[phone];
      return res.json({ message: "verify" });
    }
  } catch (error) {
    return res.json({ error, message: error.message });
  }
};

//  user requests
exports.getUserList = async (req, res) => {
  try {
    const { admin_id } = req;
    if (!admin_id) {
      return res.status("admin id require");
    }
    const users = await userModel.find({});
    if (!users || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "failed to fetch users",
      });
    }
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.json({ error, message: error.message });
  }
};

exports.deleteAndBlockUser = async (req, res) => {
  try {
    const { user_id, action } = req.query;

    if (!user_id || !action) {
      return res.status(400).json({
        status: false,
        message: "user_id and action are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        status: false,
        message: "invalid user_id",
      });
    }

    const allowedActions = ["delete", "block", "unblock", "restore"];
    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        status: false,
        message: "invalid action",
      });
    }

    let update = {};

    switch (action) {
      case "delete":
        update = {
          isDelete: true,
        };
        break;

      case "block":
        update = {
          isBlock: true,
        };
        break;
    }

    const user = await userModel.findByIdAndUpdate(
      {
        _id: user_id,
        isDelete: { $ne: true },
        isBlock: { $ne: true },
      },
      { $set: update },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "user not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: `user ${action} successful`,
      data: {
        id: user._id,
        isBlock: user.isBlock,
        isDelete: user.isDelete,
      },
    });
  } catch (error) {
    console.error("updateUserStatus error:", error);
    return res.status(500).json({
      status: false,
      message: "internal server error",
    });
  }
};
