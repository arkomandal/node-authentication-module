const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller.js');
const validate = require('../middlewares/joi').validate;
const UserSchema = require('../middlewares/joi/user');
const authenticate = require('../middlewares/jwt').authenticate_user;

router.post('/signup',
    validate(UserSchema.signup, 'body'),
    AuthController.signup
);
router.post('/login', AuthController.login);
router.get('/profile',
    validate(UserSchema.auth, 'headers'),
    authenticate,
    AuthController.profile
);

router.get('/holiday', (req,res)=>{
    res.send('it is a holiday')
})
// router.get('/refresh-token/:refreshToken', AuthController.refreshToken);
// router.post('/forgetPassword', AuthController.forgetPassword);
// router.get('/resetPassword', AuthController.resetPassword);
// router.post('/changePassword', AuthController.changePassword);
// router.get('/logout', AuthController.logout);

module.exports = router;