const express = require('express');
const router = express.Router();
const {
  addVehicle, getVehicles, updateVehicle, deleteVehicle,
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', addVehicle);
router.get('/', getVehicles);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

module.exports = router;
