const router   = require('express').Router();
const delivery = require('../controllers/deliveryController');
const auth     = require('../middleware/authMiddleware');
const role     = require('../middleware/roleMiddleware');

router.get('/available',
  auth, role('VOLUNTEER'), delivery.getAvailableDeliveries);

router.get('/my',
  auth, role('VOLUNTEER'), delivery.getMyDeliveries);

router.get('/:id',
  auth, delivery.getDelivery);

router.get('/by-request/:requestId',
   auth, delivery.getDeliveryByRequest);

router.post('/accept',
  auth, role('VOLUNTEER'), delivery.acceptDelivery);

router.patch('/:id/status',
  auth, role('VOLUNTEER'), delivery.updateStatus);

router.patch('/:id/location',
  auth,role('VOLUNTEER'), delivery.updateLocation
);

  

module.exports = router;