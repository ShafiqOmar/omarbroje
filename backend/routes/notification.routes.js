const router       = require('express').Router();
const notification = require('../controllers/notificationController');
const auth         = require('../middleware/authMiddleware');

router.get('/',
  auth, notification.getMyNotifications);

router.get('/unread-count',
  auth, notification.getUnreadCount);

router.patch('/:id/read',
  auth, notification.markAsRead);

router.patch('/read-all',
  auth, notification.markAllAsRead);

router.delete('/:id',
  auth, notification.deleteNotification);

module.exports = router;