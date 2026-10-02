const express = require('express');
const router = express.Router();
const dashboardCtrl = require('../controller/dashboardController');

router.get('/stats', dashboardCtrl.getDashboardStats);
router.get('/serie', dashboardCtrl.getDashboardSerie);
router.get('/status-distribution', dashboardCtrl.getDashboardStatusDistribution);
router.get('/wilayas', dashboardCtrl.getDashboardWilayas);

module.exports = router;
