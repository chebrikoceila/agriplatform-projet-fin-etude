const express = require('express');
const authJwt = require('../middleware/authJwt');
const authCtrl = require('../controller/authController');

const router = express.Router();

router.get('/me', authJwt, authCtrl.getMe);
router.patch('/me', authJwt, authCtrl.patchMe);

module.exports = router;
