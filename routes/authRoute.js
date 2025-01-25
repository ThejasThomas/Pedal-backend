const express = require('express');
const { googleAuth } = require('../controller/auth/GooleAuth');
const verifyUser = require('../Middleware/userAuth');
const authRoute = express.Router();

authRoute.post('/googleAuth', googleAuth);

module.exports = authRoute;
