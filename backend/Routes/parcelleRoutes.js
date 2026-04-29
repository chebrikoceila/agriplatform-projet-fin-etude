const express = require('express');
const router = express.Router();
const parcelleCtrl = require('../controller/parcelleController');

router.post('/', parcelleCtrl.createParcelle);
router.get('/', parcelleCtrl.getAllParcelles);
router.get('/:id', parcelleCtrl.getParcelleDetails);
router.put('/:id', parcelleCtrl.updateParcelle);
router.delete('/:id', parcelleCtrl.deleteParcelle);

module.exports = router;