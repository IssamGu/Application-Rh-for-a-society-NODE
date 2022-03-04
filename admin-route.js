const express = require('express');
const router = express.Router();

const admin_controller = require('../controllers/admin-controller');
const requireLoginAdmin = require('../middleware/requireLoginAdmin');

/** administrateur: Se connecter */
router.post('/api/admin-login', admin_controller.admin_login)

/** ajouter un administrateur */
router.post('/api/add-admin', admin_controller.add_admin)

/** supprimer un administrateur */
router.delete('/api/delete-admin', admin_controller.delete_admin)

/** oubli de mot de passe */
router.put('/api/forgot-admin-password', admin_controller.forgot_password)

/** modifier le mot de passe oublie : lien mail */
router.put('/api/reset-admin-password', admin_controller.reset_password)

/** modifier le mot de passe */
router.put('/api/change-admin-password', requireLoginAdmin ,admin_controller.change_password)

/** show admin profile */
router.get('/api/show-admin-profile', requireLoginAdmin, admin_controller.show_profile)

module.exports = router