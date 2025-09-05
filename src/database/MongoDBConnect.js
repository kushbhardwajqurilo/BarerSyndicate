// require('dotenv').config({})
const mongoose = require("mongoose");
mongoose
  .connect(process.env.DB_URI, {})
  .then(
    (res) => {
      console.log("database connected");
    },
    (fail) => {
      console.log("databse not connected");
    }
  )
  .catch((err) => {
    console.log("err", err);
  });
