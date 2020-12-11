const express = require('express');
const router = express.Router();

let authAdminRoute = require('./auth.admin')

router.use('/auth', authAdminRoute);

module.exports = router;