const mongoose = require('mongoose');
const adminSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone:{
        type:String,
        unique:true,
        require:true,
    },
    role: {
        type: String,
        default: 'admin'
    },
    failAttemp:{
        type:Number,
        default:0
    },
    lockAccount:{
        type:Date,
        default:null
    }
})

const adminModel = new mongoose.model('Admin', adminSchema);
module.exports = adminModel;