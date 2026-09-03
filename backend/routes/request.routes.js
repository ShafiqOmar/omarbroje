const router  = require('express').Router();
const request = require('../controllers/requestController');
const auth    = require('../middleware/authMiddleware');
const role    = require('../middleware/roleMiddleware');

// ── Static routes أولاً ──
router.get('/charity/report',
  auth, role('CHARITY'), request.getCharityReport);

router.get('/provider',
  auth, role('PROVIDER'), request.getProviderRequests);

router.get('/my',
  auth, role('CHARITY'), request.getMyRequests);

// ── Dynamic routes بعدين ──
router.post('/',
  auth, role('CHARITY'), request.createRequest);

router.patch('/:id/approve',
  auth, role('PROVIDER'), request.approveRequest);

router.patch('/:id/reject',
  auth, role('PROVIDER'), request.rejectRequest);

router.patch('/:id/cancel',
  auth, role('CHARITY'), request.cancelRequest);

module.exports = router;