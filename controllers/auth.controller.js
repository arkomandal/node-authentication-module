const db = require('../db/models/index');
const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const forgot_password_template = require('../templates/forgot_password.template');
const registration_template = require('../templates/registration.template');
const send_email = require('../services/email.service').sendGrid;
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
    try {
        let email_exist = await db.User.count({
            where: {
                email: req.body.email
            }
        });
        if (email_exist > 0) {
            return res.status(409).json({ status: 409, message: 'Email Id already exists', data: null, error: null });
        }
        else {
            let password_clean = req.body.password;
            bcrypt.genSalt(10, async (err, salt) => {
                if (err) return res.status(500).json({ status: 500, message: 'Internal Server Error', data: data, error: err });
                bcrypt.hash(req.body.password, salt, async (err, hash) => {
                    if (err) return res.status(500).json({ status: 500, message: 'Internal Server Error', data: data, error: err });
                    req.body.password = hash;
                    let data = await db.User.create(req.body);
                    let email_options = {
                        from: process.env.AGENT_EMAIL_ID,
                        to: req.body.email,
                        subject: 'Welcome Mail',
                        html: await registration_template({
                            url: 'http://www.demo.com',
                            email: req.body.email,
                            password: password_clean
                        })
                    }
                    await send_email(email_options).then(async (email_response) => {
                        console.log(email_response);
                        return res.status(200).json({ status: 200, message: "Success", data: data });
                    }).catch(err => {
                        console.log(err);
                        return res.status(500).json({ status: 500, message: 'Internal Server Error', error: err });
                    });
                });
            });
        }
    }
    catch (error) {
        console.log(error);
    }
}

exports.login = async (req, res) => {
    try {
        let user = await db.User.findOne({
            where: {
                email: req.body.email
            },
            // nested: true,
            raw: true
        })
        // .then((user) => user ? user.get({ plain: true }) : user);
        if (user) {
            bcrypt.compare(req.body.password, user.password).then(async (result) => {
                if (result == true) {
                    let accessToken = jwt.sign({
                        data: user.id, expiresIn: '30d'
                    }, process.env.JWT_ACCESS_TOKEN_SALT);
                    let refreshToken = jwt.sign({
                        data: user.id, expiresIn: '60d'
                    }, process.env.JWT_REFRESH_TOKEN_SALT);
                    const { password, ...userWithoutPassword } = user;
                    let today = new Date();
                    await db.RefreshToken.create({
                        userId: user.id,
                        refreshToken: refreshToken,
                        expiresOn: today.setDate(today.getDate() + 60)
                    });
                    let user_details = {
                        ...userWithoutPassword,
                        accessToken: accessToken,
                        refreshToken: refreshToken
                    };
                    res.status(200).json({ status: 200, message: 'You have successfully logged in', data: user_details, error: null });
                }
                else {
                    return res.status(401).json({ status: 401, message: 'The password you have entered is not correct. Please enter correct password to login into your account', data: null, error: null });
                }
            });
        }
        else {
            return res.status(401).json({ status: 401, message: 'There is no account registered with that email address.', data: null, error: null });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null, error: err });
    }

}

exports.profile = async (req, res) => {
    try {
        let data = await db.User.findOne({
            where: {
                id: req.headers.user_id
            },
            include:{
                model: db.RefreshToken
            },
            attributes: {
                exclude: ['password']
            }
        });
        if (!data) return res.status(403).json({ status: 403, message: "User does not exist" })
        else return res.status(200).json({ status: 200, message: "Success", data: data })
    }
    catch (e) {
        console.log("Error : ", e);
        return res.status(500).json({ status: 500, message: 'Internal Server Error' });
    }
}

exports.refreshToken = async (req, res) => {
    try {
        var creds = req.credentials;
        var refreshToken = req.params.refreshToken;
        var user = await userRepo.findUser({id:creds.id});
        var userData = user.dataValues;
        var tokenRecord = await commonRepo.getRefreshToken({userId:creds.id,refreshToken:refreshToken,isExpire:0});
        if(!tokenRecord) {
            return res.status(403).json({
                status: 403,
                message: "Refresh Token Invalid",
                accessToken:'',
                refreshToken:''
            })  
        }
        var date = new Date();
        var refreshTokenUpdateTime = new Date(tokenRecord.dataValues.updatedAt);
        var deviceId = req.headers['deviceId'];
        var accessToken = jwt.sign({ email:userData.email,id:userData.id,userType:userData.userType,deviceId:deviceId },process.env.JWT_SECRET,{ expiresIn: '2d'});
        if(date.getTime()-refreshTokenUpdateTime.getTime()>(30*60*1000)) {
            await sequelize.transaction(async(transaction)=>{
                await commonRepo.updateRefreshToken({refreshToken:refreshToken},{isExpire:1},transaction);
                refreshToken = jwt.sign({ email:userData.email,id:userData.id,userType:userData.userType,deviceId:deviceId },process.env.JWT_SECRET,{ expiresIn: '4d'});
                await commonRepo.saveRefreshToken({
                    userType:userData.type,
                    userId:userData.id,
                    refreshToken:refreshToken
               },transaction);  
            });
        }
        return res.status(200).json({
            status: 200,
            message: "Refresh Token",
            accessToken:accessToken,
            refreshToken:refreshToken
        })      
    }
    catch (e) {
        console.log("Refresh Token Error : ", e);
        return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null, error: err });
    }
}

exports.forgetPassword = async (req, res) => {
    let transaction;
    try {
        transaction = await db.sequelize.transaction();
        let user = await db.user.findOne({
            where: {
                email: req.body.email,
                active: 1
            },
            include: {
                model: db.role
            }
        }).then((user) => user ? user.get({ plain: true }) : user);
        if (user) {
            let email_token = unique_id();
            await db.user.update({ email_token: email_token, email_token_created_at: Date.now() },
                {
                    where: {
                        email: req.body.email,
                        active: 1
                    },
                    transaction
                });
            const resetPasswordLink = process.env.BASEURL + `/auth/reset-password/${req.body.email}/${email_token}`;
            let email_options = {
                from: process.env.AGENT_EMAIL_ID,
                to: req.body.email,
                subject: 'Reset Password | Kaya',
                html: await forgot_password_template({ resetPasswordLink: resetPasswordLink })
            }
            await send_email(email_options).then(async (email_response) => {
                console.log(email_response);
                res.status(200).json({
                    status: 200,
                    message: "An email with the reset password link has been sent to your registered email address. Please try again after some time if you have not received the email.",
                    data: null,
                    error: null
                });
                return await transaction.commit();
            }).catch(async (err) => {
                if (transaction) await transaction.rollback();
                console.log(err);
                return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null, error: err });
            });
        }
        else {
            return res.status(400).json({ status: 400, message: 'User not found', data: null, error: null });
        }
    }
    catch (err) {
        if (transaction) await transaction.rollback();
        console.log(err);
        return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null, error: err });
    }
}

exports.resetPassword = async (req, res) => {
    let transaction;
    try {
        transaction = await db.sequelize.transaction();
        const { email, email_token, password } = req.body;
        let user = await db.user.findOne({
            where: {
                email: email,
                email_token: email_token
            },
            include: {
                model: db.role
            }
        }).then((user) => user ? user.get({ plain: true }) : user);
        if (user) {
            let user_email_token = await db.user.findOne({
                where: {
                    email: email,
                    email_token: email_token,
                    email_token_created_at: {
                        [db.Sequelize.Op.gt]: new Date(Date.now() - (60 * 60 * 1000)) //1 hour
                    }
                }
            });
            if (!user_email_token) {
                res.status(401).json({
                    status: 401,
                    msg: "Token expired"
                })
            }
            else {
                bcrypt.genSalt(10, async (err, salt) => {
                    if (err) {
                        return res.status(500).json({ status: 500, message: 'Internal Server Error', data: data, error: err });
                    }
                    bcrypt.hash(password, salt, async (err, hash) => {
                        if (err) {
                            return res.status(500).json({ status: 500, message: 'Internal Server Error', data: data, error: err });
                        }
                        let data = await db.user.update({
                            email_token: null,
                            email_token_created_at: null,
                            password: hash
                        }, {
                            where: {
                                email: req.body.email,
                                email_token: email_token,
                            },
                            transaction
                        });
                        res.status(200).json({ status: 200, message: 'Your account password has been successfully updated', data: data, error: null });
                        return await transaction.commit();
                    });
                });
            }
        }
        else {
            res.status(400).json({
                status: 400,
                msg: "Token doesn't match"
            })
        }
    }
    catch (err) {
        if (transaction) await transaction.rollback();
        console.log(err);
        return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null, error: err });
    }
}

exports.changePassword = async (req, res) => {
    let transaction;
    try {
        transaction = await db.sequelize.transaction();
        const { old_password, new_password } = req.body;
        let user = await db.user.findOne({
            where: {
                id: req.headers.user_id,
                active: 1
            },
            include: {
                model: db.role
            }
        }).then((user) => user ? user.get({ plain: true }) : user);
        if (user) {
            bcrypt.compare(old_password, user.password).then(async (result) => {
                if (result == true) {
                    if (old_password == new_password) {
                        return res.status(422).json({ status: 422, message: 'New Password cannot be same as old password', data: null, error: null });
                    }
                    else {
                        bcrypt.genSalt(10, async (err, salt) => {
                            if (err) {
                                return res.status(500).json({ status: 500, message: 'Internal Server Error', data: data, error: err });
                            }
                            bcrypt.hash(new_password, salt, async (err, hash) => {
                                if (err) {
                                    return res.status(500).json({ status: 500, message: 'Internal Server Error', data: data, error: err });
                                }
                                let data = await db.user.update({
                                    password: hash
                                }, {
                                    where: {
                                        id: req.headers.user_id,
                                        active: 1
                                    },
                                    transaction
                                });
                                res.status(200).json({ status: 200, message: 'Your password has been successfully updated', data: data, error: null });
                                return await transaction.commit();
                            });
                        });
                    }
                }
                else {
                    return res.status(400).json({ status: 400, message: "Old password doesn't match", data: null, error: null });
                }
            });
        }
        else {
            return res.status(400).json({ status: 400, message: "User not found", data: null, error: null })
        }
    }
    catch (err) {
        if (transaction) await transaction.rollback();
        console.log(err);
        return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null, error: err });
    }
}

exports.logout = async (req, res) => {
    try {
        let data = await db.UserLoginSession.update({ active: 0 }, {
            where: {
                user_id: req.headers.user_id,
                active: 1
            }
        });
        res.status(200).json({ status: 200, message: 'You have successfully logged out of the system', data: data, error: null });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ status: 500, message: 'Internal Server Error', data: null, error: err });
    }
}