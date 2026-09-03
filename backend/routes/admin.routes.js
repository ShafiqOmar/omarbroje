const router = require('express').Router();
const admin  = require('../controllers/adminController');
const auth   = require('../middleware/authMiddleware');
const role   = require('../middleware/roleMiddleware');

// All routes — ADMIN only
router.use(auth, role('ADMIN'));

router.get('/users',              admin.getAllUsers);
router.get('/users/pending',      admin.getPendingUsers);
router.patch('/users/:id/approve',admin.approveUser);
router.patch('/users/:id/suspend',admin.suspendUser);
router.delete('/users/:id',       admin.deleteUser);
router.get('/statistics',         admin.getStatistics);
router.get('/logs',               admin.getLogs);
router.get('/alerts/pending',     admin.getPendingAlerts);
router.get('/impact-report', admin.getImpactReport);
router.get('/active-deliveries', auth, role('ADMIN'), admin.getActiveDeliveries);

module.exports = router;