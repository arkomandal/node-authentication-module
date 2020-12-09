exports.login = async (req, res) => {
    try {
        if (!req.headers['deviceid']) {
            return res.status(403).json({
                status: 403,
                message: "Device ID missing"
            })
        }
        if (!req.headers['devicetoken']) {
            return res.status(403).json({
                status: 403,
                message: "Device Token missing"
            })
        }
        var body = req.body;
        var deviceType = req.headers['user-agent'];
        var deviceId = req.headers['deviceid'];
        var deviceToken = req.headers['devicetoken'];
        let data_check = {};
        data_check.email = body.email;
        let data_fetch = await userRepo.findUser(data_check);
        if (!data_fetch) {
            return res.status(403).json({
                status: 403,
                message: "Invalid Credential"
            })
        } else {////////////////////////");
            var userData = data_fetch.dataValues;
            if (userData.isActive == 0 || userData.isVerifiedPhone == 0) {
                return res.status(403).json({ status: 403, message: "Your account is not active" })
            }
            if (userData.type === 2) {
                return res.status(403).json({ status: 403, message: "Invalid Credentials", data: {}, purpose: 'login' });
            }
            var currentPasswordHash = userData.password;
            let passwordHash = commonFunction.createPasswordHash(body.password, process.env.PASSWORD_SALT);
            if (currentPasswordHash == passwordHash) {
                if (deviceType !== 1 && deviceType !== 2)
                    deviceType = 1;
                var accessToken = jwt.sign({ email: userData.email, id: userData.id, userType: userData.userType, deviceId: deviceId }, process.env.JWT_SECRET, { expiresIn: '2d' });
                var refreshToken = jwt.sign({ email: userData.email, id: userData.id, userType: userData.userType, deviceId: deviceId }, process.env.JWT_SECRET, { expiresIn: '4d' });
                await sequelize.transaction(async (t) => {
                    await commonRepo.saveRefreshToken({ userType: userData.type, userId: userData.id, refreshToken: refreshToken }, t);
                    let deviceDetails = { uid: userData.id, role: userData.type, deviceType: deviceType, deviceId: deviceId, deviceToken: deviceToken };
                    await userRepo.createDevice(deviceDetails, t);
                });
                let data = {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    isVerifiedEmail: userData.isVerifiedEmail,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    image: userData.image
                };
                return res.status(200).json({
                    status: 200,
                    message: "Logged in successfully",
                    data: data,
                    purpose: "login"
                })
            }
            else {
                return res.status(403).json({
                    status: 403,
                    message: "Invalid Credentials",
                    data: {},
                    purpose: 'login'
                })
            }
        }
    }
    catch (e) {
        console.log("User Login Error : ", e);
        return res.status(500).json({
            status: 500,
            message: responseMessages.errorMsg
        })
    }
}

exports.profile = async (req, res) => {
    try {
        if (!req.headers['deviceid']) {
            return res.status(403).json({
                status: 403,
                message: "Device ID missing"
            })
        }
        if (!req.headers['devicetoken']) {
            return res.status(403).json({
                status: 403,
                message: "Device Token missing"
            })
        }
        var body = req.body;
        var deviceType = req.headers['user-agent'];
        var deviceId = req.headers['deviceid'];
        var deviceToken = req.headers['devicetoken'];
        let data_check = {};
        data_check.email = body.email;
        let data_fetch = await userRepo.findUser(data_check);
        if (!data_fetch) {
            return res.status(403).json({
                status: 403,
                message: "Invalid Credential"
            })
        } else {////////////////////////");
            var userData = data_fetch.dataValues;
            if (userData.isActive == 0 || userData.isVerifiedPhone == 0) {
                return res.status(403).json({ status: 403, message: "Your account is not active" })
            }
            if (userData.type === 2) {
                return res.status(403).json({ status: 403, message: "Invalid Credentials", data: {}, purpose: 'login' });
            }
            var currentPasswordHash = userData.password;
            let passwordHash = commonFunction.createPasswordHash(body.password, process.env.PASSWORD_SALT);
            if (currentPasswordHash == passwordHash) {
                if (deviceType !== 1 && deviceType !== 2)
                    deviceType = 1;
                var accessToken = jwt.sign({ email: userData.email, id: userData.id, userType: userData.userType, deviceId: deviceId }, process.env.JWT_SECRET, { expiresIn: '2d' });
                var refreshToken = jwt.sign({ email: userData.email, id: userData.id, userType: userData.userType, deviceId: deviceId }, process.env.JWT_SECRET, { expiresIn: '4d' });
                await sequelize.transaction(async (t) => {
                    await commonRepo.saveRefreshToken({ userType: userData.type, userId: userData.id, refreshToken: refreshToken }, t);
                    let deviceDetails = { uid: userData.id, role: userData.type, deviceType: deviceType, deviceId: deviceId, deviceToken: deviceToken };
                    await userRepo.createDevice(deviceDetails, t);
                });
                let data = {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    isVerifiedEmail: userData.isVerifiedEmail,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    image: userData.image
                };
                return res.status(200).json({
                    status: 200,
                    message: "Logged in successfully",
                    data: data,
                    purpose: "login"
                })
            }
            else {
                return res.status(403).json({
                    status: 403,
                    message: "Invalid Credentials",
                    data: {},
                    purpose: 'login'
                })
            }
        }
    }
    catch (e) {
        console.log("User Login Error : ", e);
        return res.status(500).json({
            status: 500,
            message: responseMessages.errorMsg
        })
    }
}

exports.refreshToken = async (req, res) => {
    try {
        if (!req.headers['deviceid']) {
            return res.status(403).json({
                status: 403,
                message: "Device ID missing"
            })
        }
        if (!req.headers['devicetoken']) {
            return res.status(403).json({
                status: 403,
                message: "Device Token missing"
            })
        }
        var body = req.body;
        var deviceType = req.headers['user-agent'];
        var deviceId = req.headers['deviceid'];
        var deviceToken = req.headers['devicetoken'];
        let data_check = {};
        data_check.email = body.email;
        let data_fetch = await userRepo.findUser(data_check);
        if (!data_fetch) {
            return res.status(403).json({
                status: 403,
                message: "Invalid Credential"
            })
        } else {////////////////////////");
            var userData = data_fetch.dataValues;
            if (userData.isActive == 0 || userData.isVerifiedPhone == 0) {
                return res.status(403).json({ status: 403, message: "Your account is not active" })
            }
            if (userData.type === 2) {
                return res.status(403).json({ status: 403, message: "Invalid Credentials", data: {}, purpose: 'login' });
            }
            var currentPasswordHash = userData.password;
            let passwordHash = commonFunction.createPasswordHash(body.password, process.env.PASSWORD_SALT);
            if (currentPasswordHash == passwordHash) {
                if (deviceType !== 1 && deviceType !== 2)
                    deviceType = 1;
                var accessToken = jwt.sign({ email: userData.email, id: userData.id, userType: userData.userType, deviceId: deviceId }, process.env.JWT_SECRET, { expiresIn: '2d' });
                var refreshToken = jwt.sign({ email: userData.email, id: userData.id, userType: userData.userType, deviceId: deviceId }, process.env.JWT_SECRET, { expiresIn: '4d' });
                await sequelize.transaction(async (t) => {
                    await commonRepo.saveRefreshToken({ userType: userData.type, userId: userData.id, refreshToken: refreshToken }, t);
                    let deviceDetails = { uid: userData.id, role: userData.type, deviceType: deviceType, deviceId: deviceId, deviceToken: deviceToken };
                    await userRepo.createDevice(deviceDetails, t);
                });
                let data = {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    isVerifiedEmail: userData.isVerifiedEmail,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    image: userData.image
                };
                return res.status(200).json({
                    status: 200,
                    message: "Logged in successfully",
                    data: data,
                    purpose: "login"
                })
            }
            else {
                return res.status(403).json({
                    status: 403,
                    message: "Invalid Credentials",
                    data: {},
                    purpose: 'login'
                })
            }
        }
    }
    catch (e) {
        console.log("User Login Error : ", e);
        return res.status(500).json({
            status: 500,
            message: responseMessages.errorMsg
        })
    }
}

exports.forgetPassword = async (req, res) => {
}

exports.resetPassword = async (req, res) => {
}

exports.changePassword = async (req, res) => {

}

exports.logout = async (req, res) => {

}