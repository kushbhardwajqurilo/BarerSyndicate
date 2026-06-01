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
  const file = req?.body?.file;
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
    const payload = {
      name,
      email,
      password: hashPassword(password),
      address,
      gstnumber,
      phone,
      idProof: file,
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
    // const apiUrl = `https://sms.autobysms.com/app/smsapi/index.php?key=45FA150E7D83D8&campaign=0&routeid=9&type=text&contacts=${phone}&senderid=SMSSPT&msg=Your OTP is ${otp} SELECTIAL&template_id=1707166619134631839`;
    // const response = await axios.get(apiUrl);
    const forgetMailTemplate = (data) => {
      return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>

 <body style="
margin:0;
padding:0;
background:#f4f7fb;
font-family:'Poppins','Segoe UI',Arial,sans-serif;
">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding: 40px 20px">
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
              box-shadow: 0 10px 35px rgba(0, 0, 0, 0.05);
            "
          >
            <!-- Header -->
            <tr>
              <td style="padding: 32px 40px; border-bottom: 1px solid #eef2f7">
                <table width="100%">
                  <tr>
                    <td align="left">
                      <div
                        style="
                          font-size: 24px;
                          font-weight: 700;
                          color: #111827;
                        "
                      >
                        Barber Syndicate
                      </div>

                      <div
                        style="
                          margin-top: 6px;
                          font-size: 13px;
                          color: #6b7280;
                          letter-spacing: 1px;
                          text-transform: uppercase;
                        "
                      >
                        Account Security
                      </div>
                    </td>

                    <td align="right">
                      <div
                        style="
                          width: 48px;
                          height: 48px;
                          border-radius: 12px;
                          background: #2563eb;
                          color: #ffffff;
                          font-size: 22px;
                          font-weight: 700;
                          line-height: 48px;
                          text-align: center;
                        "
                      >
                        S
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 50px 40px">
                <h1
                  style="
                    margin: 0;
                    font-size: 30px;
                    color: #111827;
                    font-weight: 700;
                  "
                >
                  Password Reset Request
                </h1>

                <p
                  style="
                    margin: 20px 0 0;
                    font-size: 16px;
                    line-height: 28px;
                    color: #4b5563;
                  "
                >
                  We received a request to reset the password associated with
                  your account. Use the verification code below to continue the
                  password reset process.
                </p>

                <!-- OTP Box -->
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="margin-top: 35px"
                >
                  <tr>
                    <td align="center">
                      <div
                        style="
                          display: inline-block;
                          padding: 24px 40px;
                          background: #f8fafc;
                          border: 2px solid #dbeafe;
                          border-radius: 14px;
                        "
                      >
                        <span
                          style="
                            font-size: 42px;
                            font-weight: 700;
                            letter-spacing: 14px;
                            color: #2563eb;
                            font-family: Arial, Helvetica, sans-serif;
                          "
                        >
                          ${data}
                        </span>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Expiry -->
                <div
                  style="
                    margin-top: 25px;
                    padding: 16px 20px;
                    background: #eff6ff;
                    border-left: 4px solid #2563eb;
                    border-radius: 8px;
                    font-size: 14px;
                    color: #1e40af;
                  "
                >
                  This verification code will expire in
                  <strong>5 minutes</strong>.
                </div>

                <!-- Security Notice -->
                <div
                  style="
                    margin-top: 35px;
                    padding: 24px;
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                  "
                >
                  <div
                    style="
                      font-size: 16px;
                      font-weight: 600;
                      color: #111827;
                      margin-bottom: 10px;
                    "
                  >
                    Security Notice
                  </div>

                  <div
                    style="font-size: 14px; line-height: 24px; color: #6b7280"
                  >
                    Never share this verification code with anyone. Our support
                    team will never ask for your OTP or password.
                  </div>
                </div>

                <!-- Didn't Request -->
                <div
                  style="
                    margin-top: 35px;
                    font-size: 15px;
                    line-height: 28px;
                    color: #4b5563;
                  "
                >
                  If you did not request a password reset, you can safely ignore
                  this email. No changes will be made to your account.
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  padding: 30px 40px;
                  background: #f9fafb;
                  border-top: 1px solid #e5e7eb;
                "
              >
                <div
                  style="
                    font-size: 13px;
                    color: #6b7280;
                    line-height: 24px;
                    text-align: center;
                  "
                >
                  © ${new Date().getFullYear()} Barbar Syndicate. All rights
                  reserved.
                  <br />
                  This is an automated security email. Please do not reply.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
    };
    await SentMail(user?.email, "OTP Request", "", forgetMailTemplate(otp));
    const mail = user?.email;
    const [userName, domain] = mail.split("@");

    const maskedMail =
      userName.slice(0, 2) +
      "*".repeat(Math.max(0, userName.length - 5)) +
      userName.slice(-2) +
      "@" +
      domain;

    return res.status(200).json({
      success: true,
      message: `OTP has been sent to ${maskedMail}. Check your inbox or spam folder`,
    });
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
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <title>Thank You For Contacting Us</title>

    <style>
      @media only screen and (max-width: 680px) {
        .email-container {
          width: 100% !important;
          max-width: 100% !important;
        }

        .email-wrapper {
          padding: 20px 10px !important;
        }

        .email-header {
          padding: 30px 20px !important;
        }

        .email-logo {
          width: 50px !important;
          height: 50px !important;
          font-size: 24px !important;
          line-height: 50px !important;
          margin-bottom: 12px !important;
        }

        .email-header h1 {
          font-size: 24px !important;
        }

        .email-header p {
          font-size: 12px !important;
        }

        .email-body {
          padding: 30px 20px !important;
        }

        .email-body h2 {
          font-size: 24px !important;
        }

        .email-body p {
          font-size: 14px !important;
          line-height: 26px !important;
        }

        .status-box,
        .response-box {
          margin-top: 20px !important;
        }

        .status-box td,
        .response-box td {
          padding: 18px !important;
        }

        .status-box h3,
        .response-box h3 {
          font-size: 16px !important;
        }

        .status-box p,
        .response-box p {
          font-size: 14px !important;
          line-height: 24px !important;
        }

        .email-footer {
          padding: 20px 15px !important;
        }

        .email-footer p {
          font-size: 12px !important;
          line-height: 20px !important;
        }

        .signature-section {
          margin-top: 25px !important;
          padding-top: 20px !important;
        }

        .signature-section p {
          font-size: 14px !important;
        }
      }

      @media only screen and (max-width: 480px) {
        .email-wrapper {
          padding: 15px 5px !important;
        }

        .email-header {
          padding: 20px 15px !important;
        }

        .email-logo {
          width: 45px !important;
          height: 45px !important;
          font-size: 20px !important;
          line-height: 45px !important;
          margin-bottom: 10px !important;
        }

        .email-header h1 {
          font-size: 20px !important;
        }

        .email-header p {
          font-size: 11px !important;
        }

        .email-body {
          padding: 20px 15px !important;
        }

        .email-body h2 {
          font-size: 20px !important;
        }

        .email-body p {
          font-size: 13px !important;
          line-height: 24px !important;
          margin-top: 15px !important;
        }

        .status-box,
        .response-box {
          margin-top: 15px !important;
        }

        .status-box td,
        .response-box td {
          padding: 15px !important;
        }

        .status-box h3,
        .response-box h3 {
          font-size: 15px !important;
        }

        .status-box p,
        .response-box p {
          font-size: 13px !important;
          line-height: 22px !important;
        }

        .email-footer {
          padding: 15px 10px !important;
        }

        .email-footer p {
          font-size: 11px !important;
          line-height: 18px !important;
        }

        .signature-section {
          margin-top: 20px !important;
          padding-top: 15px !important;
        }

        .signature-section p {
          font-size: 13px !important;
        }
      }
    </style>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background: #f4f7fb;
      font-family: &quot;Poppins&quot;, &quot;Segoe UI&quot;, Arial, sans-serif;
    "
  >
    <table width="100%" cellpadding="0" cellspacing="0" border="0" class="email-wrapper">
      <tr>
        <td align="center" style="padding: 40px 20px" class="email-wrapper">
          <table
            width="650"
            cellpadding="0"
            cellspacing="0"
            border="0"
            class="email-container"
            style="
              background: #ffffff;
              border-radius: 18px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
              box-shadow: 0 15px 40px rgba(0, 0, 0, 0.06);
            "
          >
            <!-- Header -->
            <tr>
              <td
                style="background: #111827; padding: 40px; text-align: center"
                class="email-header"
              >
                <div
                  class="email-logo"
                  style="
                    width: 60px;
                    height: 60px;
                    margin: 0 auto 15px;
                    border-radius: 14px;
                    background: #2563eb;
                    color: #ffffff;
                    font-size: 28px;
                    font-weight: 700;
                    line-height: 60px;
                  "
                >
                  B
                </div>

                <h1
                  style="
                    margin: 0;
                    color: #ffffff;
                    font-size: 30px;
                    font-weight: 700;
                  "
                >
                  Barber Syndicate
                </h1>

                <p
                  style="
                    margin: 10px 0 0;
                    color: #9ca3af;
                    font-size: 14px;
                    letter-spacing: 1px;
                  "
                >
                  PROFESSIONAL BARBER SERVICES
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 50px" class="email-body">
                <h2
                  style="
                    margin: 0;
                    color: #111827;
                    font-size: 32px;
                    font-weight: 700;
                  "
                >
                  Thank You for Contacting Us
                </h2>

                <p
                  style="
                    margin-top: 25px;
                    color: #374151;
                    font-size: 16px;
                    line-height: 30px;
                  "
                >
                  Dear <strong>${name}</strong>,
                </p>

                <p style="color: #4b5563; font-size: 16px; line-height: 30px">
                  Thank you for reaching out to Barber Syndicate. We have
                  successfully received your message and appreciate your
                  interest in our services.
                </p>

                <p style="color: #4b5563; font-size: 16px; line-height: 30px">
                  Our team is currently reviewing your inquiry. A member of our
                  team will get back to you as soon as possible with the
                  information or assistance you need.
                </p>

                <!-- Status Box -->
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  class="status-box"
                  style="
                    margin-top: 30px;
                    background: #f8fafc;
                    border: 1px solid #e5e7eb;
                    border-left: 5px solid #2563eb;
                    border-radius: 12px;
                  "
                >
                  <tr>
                    <td style="padding: 25px">
                      <h3
                        style="
                          margin: 0;
                          color: #111827;
                          font-size: 18px;
                          font-weight: 600;
                        "
                      >
                        Request Received Successfully
                      </h3>

                      <p
                        style="
                          margin: 12px 0 0;
                          color: #6b7280;
                          font-size: 15px;
                          line-height: 26px;
                        "
                      >
                        Your inquiry has been recorded in our system and is
                        currently awaiting review by our support team.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Response Time -->
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  class="response-box"
                  style="
                    margin-top: 25px;
                    background: #eff6ff;
                    border: 1px solid #dbeafe;
                    border-radius: 12px;
                  "
                >
                  <tr>
                    <td style="padding: 22px">
                      <h3
                        style="
                          margin: 0;
                          color: #1e40af;
                          font-size: 18px;
                          font-weight: 600;
                        "
                      >
                        Expected Response Time
                      </h3>

                      <p
                        style="
                          margin: 10px 0 0;
                          color: #1e3a8a;
                          line-height: 26px;
                          font-size: 15px;
                        "
                      >
                        Most inquiries receive a response within
                        <strong>24 business hours.</strong>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- Closing -->
                <p
                  style="
                    margin-top: 35px;
                    color: #4b5563;
                    line-height: 30px;
                    font-size: 16px;
                  "
                >
                  We appreciate your patience and look forward to assisting you.
                </p>

                <!-- Signature -->
                <div
                  class="signature-section"
                  style="
                    margin-top: 35px;
                    padding-top: 25px;
                    border-top: 1px solid #e5e7eb;
                  "
                >
                  <p
                    style="
                      margin: 0;
                      color: #111827;
                      font-weight: 600;
                      font-size: 16px;
                    "
                  >
                    Best Regards,
                  </p>

                  <p style="margin: 8px 0 0; color: #4b5563; line-height: 28px">
                    Barber Syndicate Team
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  background: #f9fafb;
                  border-top: 1px solid #e5e7eb;
                  padding: 30px;
                  text-align: center;
                "
                class="email-footer"
              >
                <p
                  style="
                    margin: 0;
                    color: #6b7280;
                    font-size: 13px;
                    line-height: 24px;
                  "
                >
                  This is an automated confirmation email. Please do not reply
                  directly to this message.
                </p>

                <p style="margin: 12px 0 0; color: #9ca3af; font-size: 13px">
                  © ${new Date().getFullYear()} Barber Syndicate. All Rights
                  Reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

    const adminMailTemplate = (name, email, message) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>New Contact Request</title>

    <style>
      body {
        margin: 0;
        padding: 0;
        background: #f4f7fb;
        font-family: "Poppins", "Segoe UI", Arial, sans-serif;
      }

      .container {
        max-width: 700px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.06);
      }

      .header {
        background: #111827;
        padding: 35px 40px;
      }

      .brand {
        color: #ffffff;
        font-size: 28px;
        font-weight: 700;
      }

      .subtitle {
        color: #9ca3af;
        margin-top: 8px;
        font-size: 13px;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .badge {
        display: inline-block;
        margin-top: 15px;
        background: #2563eb;
        color: #fff;
        padding: 10px 18px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
      }

      .content {
        padding: 45px;
      }

      .title {
        font-size: 30px;
        font-weight: 700;
        color: #111827;
        margin: 0;
      }

      .description {
        margin-top: 15px;
        color: #6b7280;
        line-height: 28px;
        font-size: 16px;
      }

      .card {
        margin-top: 20px;
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
      }

      .label {
        font-size: 12px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
      }

      .value {
        color: #111827;
        font-size: 17px;
        font-weight: 600;
      }

      .email {
        color: #2563eb;
      }

      .message-box {
        margin-top: 20px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 22px;
        color: #374151;
        line-height: 28px;
        white-space: pre-wrap;
      }

      .info {
        margin-top: 25px;
        background: #eff6ff;
        border: 1px solid #dbeafe;
        border-radius: 12px;
        padding: 20px;
      }

      .info-title {
        color: #1d4ed8;
        font-weight: 600;
        margin-bottom: 10px;
      }

      .reply-btn {
        display: inline-block;
        margin-top: 30px;
        background: #2563eb;
        color: #ffffff !important;
        text-decoration: none;
        padding: 14px 28px;
        border-radius: 10px;
        font-weight: 600;
      }

      .footer {
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        padding: 25px;
        color: #94a3b8;
        font-size: 13px;
        line-height: 24px;
      }

      @media only screen and (max-width: 680px) {
        .container {
          max-width: 100% !important;
          margin: 20px 15px !important;
          border-radius: 14px;
        }

        .header {
          padding: 25px 25px !important;
        }

        .brand {
          font-size: 24px !important;
        }

        .subtitle {
          font-size: 12px !important;
          margin-top: 6px;
        }

        .badge {
          margin-top: 12px;
          padding: 8px 15px !important;
          font-size: 12px !important;
        }

        .content {
          padding: 30px 25px !important;
        }

        .title {
          font-size: 24px !important;
        }

        .description {
          margin-top: 12px;
          font-size: 14px !important;
          line-height: 26px;
        }

        .card {
          margin-top: 15px;
          padding: 16px !important;
        }

        .label {
          font-size: 11px !important;
          margin-bottom: 6px;
        }

        .value {
          font-size: 15px !important;
        }

        .message-box {
          margin-top: 15px;
          padding: 16px !important;
          font-size: 14px !important;
          line-height: 26px;
        }

        .info {
          margin-top: 20px;
          padding: 16px !important;
        }

        .info-title {
          font-size: 14px !important;
          margin-bottom: 8px;
        }

        .info {
          font-size: 14px !important;
          line-height: 24px;
        }

        .reply-btn {
          margin-top: 25px;
          padding: 12px 24px !important;
          font-size: 14px !important;
        }

        .footer {
          padding: 18px 15px !important;
          font-size: 12px !important;
          line-height: 20px;
        }
      }

      @media only screen and (max-width: 480px) {
        .container {
          max-width: 100% !important;
          margin: 15px 10px !important;
          border-radius: 12px;
        }

        .header {
          padding: 20px 18px !important;
        }

        .brand {
          font-size: 20px !important;
        }

        .subtitle {
          font-size: 11px !important;
          margin-top: 5px;
        }

        .badge {
          margin-top: 10px;
          padding: 7px 12px !important;
          font-size: 11px !important;
        }

        .content {
          padding: 22px 18px !important;
        }

        .title {
          font-size: 20px !important;
        }

        .description {
          margin-top: 10px;
          font-size: 13px !important;
          line-height: 24px;
        }

        .card {
          margin-top: 12px;
          padding: 14px !important;
        }

        .label {
          font-size: 10px !important;
          margin-bottom: 5px;
        }

        .value {
          font-size: 14px !important;
        }

        .message-box {
          margin-top: 12px;
          padding: 14px !important;
          font-size: 13px !important;
          line-height: 24px;
        }

        .info {
          margin-top: 18px;
          padding: 14px !important;
        }

        .info-title {
          font-size: 13px !important;
          margin-bottom: 7px;
        }

        .info {
          font-size: 13px !important;
          line-height: 22px;
        }

        .reply-btn {
          margin-top: 20px;
          padding: 11px 20px !important;
          font-size: 13px !important;
        }

        .footer {
          padding: 15px 12px !important;
          font-size: 11px !important;
          line-height: 18px;
        }
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="header">
        <div class="brand">Barber Syndicate</div>

        <div class="subtitle">Contact Form Notification</div>

        <div class="badge">NEW LEAD</div>
      </div>

      <div class="content">
        <h1 class="title">New Contact Form Submission</h1>

        <p class="description">
          A new inquiry has been submitted through your website. Review the
          customer details below.
        </p>

        <div class="card">
          <div class="label">Full Name</div>
          <div class="value">${name}</div>
        </div>

        <div class="card">
          <div class="label">Email Address</div>
          <div class="value email">${email}</div>
        </div>

        <div style="margin-top: 25px">
          <div class="label">Message</div>

          <div class="message-box">${message}</div>
        </div>

        <div class="info">
          <div class="info-title">Submission Information</div>

          <div>
            Submitted At:
            <strong>${new Date().toLocaleString()}</strong>
          </div>
        </div>

        <center>
          <a href="mailto:${email}" class="reply-btn"> Reply to Customer </a>
        </center>
      </div>

      <div class="footer">
        This notification was automatically generated from your website contact
        form.
        <br />
        © ${new Date().getFullYear()} Barber Syndicate. All Rights Reserved.
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
