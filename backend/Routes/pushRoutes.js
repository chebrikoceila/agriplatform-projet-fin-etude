const express = require('express');
const router = express.Router();
const pushCtrl = require('../controller/pushController');

router.post('/subscribe', pushCtrl.subscribe);
router.post('/unsubscribe', pushCtrl.unsubscribe);

module.exports = router;
