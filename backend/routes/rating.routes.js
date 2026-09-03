const router = require('express').Router();
const rating = require('../controllers/ratingController');
const auth   = require('../middleware/authMiddleware');
const role   = require('../middleware/roleMiddleware');

router.post('/',
  auth, role('CHARITY'), rating.submitRating);

router.get('/volunteer/:volunteerId',
  auth, rating.getVolunteerRatings);

router.get('/delivery/:deliveryId',
  auth, role('CHARITY'), rating.getDeliveryRating);

module.exports = router;