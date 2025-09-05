const { adminSignup, adminLogin, searchUser, approveUser } = require('../controllers/AdminController/createAdminController');
const { adminAuthentication } = require('../middlewares/AdminAuthetication');
const { roleAuthetication } = require('../middlewares/roleBaseAuthe');

const adminRouter = require('express').Router();

adminRouter.post('/signup',adminSignup);
adminRouter.post('/login',adminLogin);
adminRouter.get('/search',searchUser);
adminRouter.put('/approve/:userid',adminAuthentication,approveUser);
module.exports = adminRouter;