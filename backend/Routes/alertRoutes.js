const express = require('express');
const router = express.Router();
const alertCtrl = require('../controller/alertController');

router.get('/', alertCtrl.listAlerts);
router.delete('/', alertCtrl.deleteAlerts);
router.patch('/:id/read', alertCtrl.markAsRead);
router.delete('/:id', alertCtrl.deleteAlert);

module.exports = router;
