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
const sentMail = require("../../config/mail/mailConfig");
const SentMail = require("../../config/mail/mailConfig");
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
      const token = jwt.sign(
        { id: isUser._id, role: "user" },
        process.env.customerKey,
        {
          expiresIn: "7d",
        },
      );
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
        } else if (isUser.status === "reject") {
          return res.status(200).json({
            success: true,
            message: "Your Profile Has Been Rejected",
          });
        } else if (isUser.status === "delete") {
          return res.status(200).json({
            success: true,
            message: "Your Profile Has Been Deleted ",
          });
        } else if (isUser.status === "block") {
          return res.status(200).json({
            success: true,
            message: "Your Profile Has Been blocked ",
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
    console.log(req.query);
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

    const allowedActions = ["delete", "block", "unblock", "reject"];
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
          status: "delete",
          isDelete: true,
        };
        break;

      case "block":
        update = {
          status: "block",
          isBlock: true,
        };
        break;

      case "unblock":
        update = {
          status: "pending",
          isDelete: false,
          isBlock: false,
        };
        break;
      case "reject":
        update = {
          status: "reject",
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
      { new: true },
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

// user send message in mail
exports.sendMessageByUser = async (req, res, next) => {
  try {
    const validation = {
      name: "",
      email: "",
      phone: "",
      message: "",
    };
    Object.keys(validation).forEach((val) => {
      if (req.body[val].toString().trim().length === 0 || !req.body[val]) {
        return res
          .status(400)
          .json({ success: false, message: `${val} Required` });
      }
    });
    const { name, email, phone, message } = req.body;

    const sentHTML = (name) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Thank You for Reaching Out!</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; color: #333; margin:0; padding:0; }
      .container { max-width:600px; background:#fff; margin:40px auto; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.08); overflow:hidden; }
      .header { background: linear-gradient(135deg, #0078ff, #00c6ff); padding:20px; color:white; text-align:center; }
      .header h1 { margin:0; font-size:22px; }
      .content { padding:25px; line-height:1.6; }
      .content h2 { font-size:20px; color:#0078ff; }
      .footer { background:#f1f3f4; text-align:center; padding:15px; font-size:13px; color:#777; }
      a { color:#0078ff; text-decoration:none; }
      .signature { margin-top:20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Thank You for Contacting Us!</h1>
      </div>
      <div class="content">
        <h2>Hey ${name},</h2>
        <p>
          We just wanted to say thank you for getting in touch! 🙌<br/>
          Your message has been received successfully, and We’ll get back to you as soon as possible.
        </p>
        <p>We really appreciate you taking the time to connect — it means a lot! 💬</p>
        <div class="signature">
          <p>
            Warm regards,<br/>
            <strong>Barber Syndicate</strong><br/>
           
          </p>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated reply. Please don’t reply to this email.<br/>
        © ${new Date().getFullYear()} Barber Syndicate | All Rights Reserved.</p>
      </div>
    </div>
  </body>
</html>
`;

    const adminMailTemplate = (name, email, message) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>New Mail From Website</title>
    <style>
      body,html{margin:0;padding:0;background:#f3f4f6;font-family:Inter,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#111}
      .wrapper{max-width:700px;margin:30px auto;padding:0 16px}
      .card{background:#fff;border-radius:14px;box-shadow:0 4px 16px rgba(0,0,0,0.08);overflow:hidden}
      .header{background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;text-align:center;padding:24px 20px}
      .header h1{margin:0;font-size:22px;font-weight:600}
      .body{padding:28px 24px}
      .body h2{margin-top:0;color:#0f172a;font-size:18px}
      .info{display:flex;flex-direction:column;gap:10px;margin:16px 0}
      .info-item{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px}
      .info-item strong{display:block;font-size:13px;color:#475569;margin-bottom:4px}
      .message-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap}
      .footer{text-align:center;padding:18px;color:#94a3b8;font-size:12px;border-top:1px solid #f1f5f9;background:#fafafa}
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="card">
        <div class="header">
          <h1>📩 New Message from Website</h1>
        </div>
        <div class="body">
          <h2>New message received</h2>

          <div class="info">
            <div class="info-item">
              <strong>👤 Name</strong>
              ${name}
            </div>
            <div class="info-item">
              <strong>✉️ Email</strong>
              ${email}
            </div>
          </div>

          <div>
            <strong style="font-size:13px;color:#475569;">💬 Message</strong>
            <div class="message-box">
${message}
            </div>
          </div>
        </div>

        <div class="footer">
          Message sent from your website contact form — ${new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  </body>
</html>
`;

    // Correct call
    const sent = await SentMail(email, "", " ", sentHTML(name));

    const sentToMe = await SentMail(
      process.env.AppMail,
      "",
      " ",
      adminMailTemplate(name, email, message),
    );
    return res.status(200).json({
      success: true,
      message: "Message sent successfully! We'll get back to you soon.",
    });
  } catch (error) {
    console.log("err", error);
    return res.status(500).json({ success: false, message: error });
  }
};
