require('dotenv').config();
const jwt = require('jsonwebtoken');

exports.authenticate_user = async (req, res, next) => {
    const accessToken = req.headers.authorization.split(' ')[1];
    jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SALT, async (err, decodedToken) => {
        if (err) {
            res.status(401).json({
                status: 401,
                message: "Invalid Token",
                data: null,
                err: err
            })
        }
        else {
            req.headers.user_id = decodedToken.data;
            next();
        }
    });
}