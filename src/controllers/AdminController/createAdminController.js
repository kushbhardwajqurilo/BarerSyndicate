const express = require("express");
const adminModel = require("../../models/adminModel");
const contactModel = require("../../models/contact.model");
const userModel = require("../../models/userModel");
const {
  hashPassword,
  compareHashPassword,
} = require("../../utitlies/hashyPassword");
const jwt = require("jsonwebtoken");
//singup admin

exports.adminSignup = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const existingAdmin = await adminModel.findOne({ email, phone });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Email / Phone already register" });
    }
    const payload = {
      name,
      email,
      phone,
      password: hashPassword(password),
    };
    const insterAdmin = await adminModel.create(payload);
    if (!insterAdmin) {
      return res.status(400).json({ message: "failed to signup" });
    }
    return res.status(200).json({ message: "admin signup success" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
exports.adminLogin = async (req, res, next) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email password require" });
    }
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "invalid email or password" });
    }
    if (admin.lockAccount && admin.lockAccount > Date.now()) {
      const unlockTime = new Date(admin.lockAccount).toLocaleTimeString();
      return res
        .status(403)
        .json({ message: `account locked until ${unlockTime}` });
    }
    const passMatch = await compareHashPassword(password, admin.password);
    if (!passMatch) {
      admin.failAttemp = (admin.failAttemp || 0) + 1;
      if (admin.failAttemp >= 3) {
        admin.lockAccount = new Date(Date.now() + 3 * 60 * 1000);
        await admin.save();
        return res.status(403).json({
          message:
            "account locked due to 3 failed attempts. try again in 3 minutes",
        });
      }
      await admin.save();
      return res.status(401).json({ message: "invalid password" });
    }
    admin.failAttemp = 0;
    admin.lockAccount = null;
    await admin.save();

    const paylod = {
      id: admin._id,
      role: admin.role,
    };
    const token = jwt.sign(paylod, process.env.secretKey, { expiresIn: "7d" });
    return res
      .status(200)
      .json({ message: "login success", adminToken: token, success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message, status: false });
  }
};
exports.pendingProfiles = async (req, res, next) => {
  try {
    const users = await userModel.find({ status: "pending" });
    if (!users) {
      return res
        .status(400)
        .json({ message: "No pending profiles found", success: false });
    }
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// get single user details

exports.getSingleUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(404)
        .json({ message: "invalid user credientials", success: false });
    }
    const userProfie = await userModel.findById(id);
    if (!userProfie) {
      return res.status(404).json({
        message: "user not found try again",
        success: false,
      });
    }
    return res.status(200).json({ success: true, data: userProfie });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", success: false });
  }
};
// get all users details
exports.getAllUserProfiles = async (req, res, next) => {
  try {
    const { id } = req;
    if (!id) {
      return res
        .status(404)
        .json({ message: "invalid admin credientials", success: false });
    }
    const users = await userModel.find({});
    if (!users) {
      return res
        .status(404)
        .json({ message: "No user profiles found", success: false });
    }
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", success: false });
  }
};

//approve user
exports.approveUser = async (req, res, next) => {
  try {
    const admin_id = req.admin_id;
    const { userid } = req.params;
    const isAdmin = await adminModel.findById(admin_id);
    if (!isAdmin) {
      return res.status(404).json({ message: "Invalid admin", success: false });
    }
    const user = await userModel.findById(userid);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    await user.updateOne({ status: "approved" });
    user.save();
    return res.status(200).json({ success: true, message: "User approved" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "something went wrong", success: false });
  }
};

// user search

exports.searchUser = async (req, res, next) => {
  try {
    const search = req.query.q;
    const query = {
      $or: [
        { name: { $regex: `^${search}`, $options: "i" } },
        { email: { $regex: `^${search}`, $options: "i" } },
        { phone: { $regex: `^${search}`, $options: "i" } },
        { phone: { $regex: `^${search}`, $options: "i" } },
        { gstnumber: { $regex: `^${search}`, $options: "i" } },
      ],
    };
    const user = await userModel.find(query);
    if (user.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

// admin contact
exports.contactDetailsController = async (req, res, next) => {
  try {
    const validationFields = ["email", "address", "phone"];
    console.log(req.body);
    for (let fields of validationFields) {
      if (
        req.body[fields].toString().trim().length === 0 ||
        !req.body[fields]
      ) {
        return res.status(400).json({
          status: false,
          message: `${fields} Missing`,
        });
      }
    }
    // const { email, address, phone } = req.body;
    const payload = ({ email, address, phone } = req.body);
    const insert = await contactModel.create(payload);
    if (!insert) {
      return res.status(400).json({
        status: false,
        message: "failed to contact details",
      });
    }
    return res
      .status(200)
      .json({ status: true, message: "contact details add successfully" });
  } catch (error) {
    return res.status(500).json({
      status: "Something Went Wrong",
      message: error.message,
    });
  }
};

// get contact details
exports.getContactDetailsController = async (req, res, next) => {
  const contact = await contactModel.findOne();
  if (!contact) {
    return res.status(400).json({
      status: false,
      message: "no contact found",
    });
  }
  return res.status(200).json({
    status: false,
    message: "contact fetch success",
    data: contact,
  });
};

// updare contact details
exports.updateContactDetails = async (req, res) => {
  try {
    const validationFields = ["email", "address", "phone"];

    for (let field of validationFields) {
      if (!req.body[field] || req.body[field].toString().trim().length === 0) {
        return res.status(400).json({
          status: false,
          message: `${field} is required`,
        });
      }
    }

    const { email, phone, address } = req.body;

    const updatedContact = await contactModel.findOneAndUpdate(
      {},
      { email, phone, address },
      { new: true }
    );

    if (!updatedContact) {
      return res.status(404).json({
        status: false,
        message: "Contact details not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Contact details updated successfully",
      data: updatedContact,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
