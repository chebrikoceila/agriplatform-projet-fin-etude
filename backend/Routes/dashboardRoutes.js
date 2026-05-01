const express = require('express');
const router = express.Router();
const dashboardCtrl = require('../controller/dashboardController');

router.get('/stats', dashboardCtrl.getDashboardStats);

module.exports = router;
