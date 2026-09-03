const router = require('express').Router();
const auth   = require('../controllers/authController');
const verify = require('../middleware/authMiddleware');

router.post('/register',      auth.register);
router.post('/login',         auth.login);
router.post('/refresh-token', auth.refreshToken);
router.post('/logout',        auth.logout);
router.get('/profile',        verify, auth.getProfile);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password',  auth.resetPassword);
router.patch('/capacity', verify, auth.updateCapacity);

module.exports = router;