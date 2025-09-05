const mongoose = require('mongoose');
const COLLECTIONS = require('../database/Collection');
const userSchema = mongoose.Schema({
    name: {
        type:String,
        required:[true , 'Name Missing']
    },
     email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone:{
        type:String,
        required:[true,'Phone Number is required'],
        max:10,
    },
    password:{
        type:String,
        required:[true,"Password Required"],
        
    },
    address:{
        type:String,
        required:[true ,"Address is required"],
        max:100
    },
    gstnumber:{
        type:String,
        required:[true,"GST Number is required"]
    },
    status:{
        type:String,
        default:"pending"
    }
})

const userModel = mongoose.model(COLLECTIONS.user, userSchema);
module.exports = userModel;