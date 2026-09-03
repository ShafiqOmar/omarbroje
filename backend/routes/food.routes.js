const router = require('express').Router();
const food   = require('../controllers/foodController');
const auth   = require('../middleware/authMiddleware');
const role   = require('../middleware/roleMiddleware');

router.get('/',         auth, food.getListings);
router.get('/my',       auth, role('PROVIDER'), food.getMyListings);
router.get('/:id',      auth, food.getListing);
router.post('/',        auth, role('PROVIDER'), food.createListing);
router.put('/:id',      auth, role('PROVIDER'), food.updateListing);
router.delete('/:id',   auth, role('PROVIDER'), food.deleteListing);

module.exports = router;