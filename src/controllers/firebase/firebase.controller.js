const { default: mongoose } = require("mongoose");
const fcmTokenModel = require("../../models/firebaseToken.model");
const firebasAddmin = require("../../config/firebase/firebase");
const { url } = require("../../config/cloudinary/cloudinary");
exports.saveFcmToken = async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const { fcm_token } = req.body;

    if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        status: false,
        message: "User id missing or invalid",
      });
    }

    let user_token = await fcmTokenModel.findOne({ userId: user_id });

    // If token doesn't exist create one
    if (!user_token) {
      user_token = await fcmTokenModel.create({
        userId: user_id,
        fcm_token: fcm_token,
      });

      return res.status(200).json({
        success: true,
        message: "Token saved",
      });
    }

    // Update if token changed
    if (user_token.fcm_token !== fcm_token) {
      user_token.fcm_token = fcm_token;
      await user_token.save();
    }

    res.status(200).json({
      success: true,
      message: "Token updated",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//
exports.sendFirebaseNotification = async (url) => {
  try {
    // Fetch users with valid FCM tokens
    const users = await fcmTokenModel.find({
      fcm_token: { $exists: true, $ne: null },
    });

    if (!users || users.length === 0) {
      return false;
    }

    // Collect all unique tokens (flatten and deduplicate if needed)
    const tokens = [...new Set(users.flatMap((user) => user.fcm_token))];

    if (tokens.length === 0) {
      return false;
    }

    // ← Change to your real production URL

    const message = {
      tokens, // array of registration tokens
      notification: {
        title: "New product added!",
        body: "Product name is confirmed – check it out now!",
      },
      webpush: {
        fcm_options: {
          link: url, // ← This makes click open the URL reliably (browser handles it natively)
        },
        headers: {
          Urgency: "high", // Helps with delivery priority
        },
        notification: {
          icon: "", // full https URL recommended
          badge: "",
          vibrate: [200, 100, 200],
        },
      },
      data: {
        // Optional: extra data your foreground handler might use
        title: "New product added!",
        body: "Product name is confirmed – check it out now!",
        url: url,
        type: "new_product",
        timestamp: Date.now().toString(),
      },
      android: {
        priority: "high",
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
      },
    };

    const response = await firebasAddmin
      .messaging()
      .sendEachForMulticast(message);
    // Optional: Log & clean invalid tokens (important for production!)
    const invalidTokens = [];
    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (
          errorCode === "messaging/registration-token-not-registered" ||
          errorCode === "messaging/invalid-registration-token"
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      console.warn(`Found ${invalidTokens.length} invalid/expired tokens`);
      // Uncomment in production to remove them:
      // await fcmTokenModel.updateMany(
      //   { fcm_token: { $in: invalidTokens } },
      //   { $pull: { fcm_token: { $in: invalidTokens } } }
      // );
    }

    return true;
  } catch (error) {
    console.error("Error sending FCM notification:", error);
    return false;
  }
};
