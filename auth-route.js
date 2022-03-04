var express = require('express');
var router = express.Router();

var auth_controller = require('../controllers/auth-controller');
const requireAuth = require('../middleware/requireAuth');
const requireLogin = require('../middleware/requireLogin');

/** signin */
router.post('/api/signin', auth_controller.signin)

/** click forgot password */
router.put('/api/forgot-password-user', auth_controller.forgot_password)

/** link reset password */
router.put('/api/reset-password-user', auth_controller.reset_password)

/** change your password */
router.put('/api/new-password-user', requireAuth ,auth_controller.change_password)

/** show profile */
router.get('/api/profile', requireAuth, auth_controller.get_profile)

/** logout user */
router.get('/api/logout', auth_controller.logout);

/** protected - test */
router.get('/protected', requireAuth, (req, res) => {
    res.send("hello")
})

module.exports = router