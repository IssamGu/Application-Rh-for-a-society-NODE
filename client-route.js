const express = require('express')
const router = express.Router()

const client_controller = require('../../controllers/facturation/client-controller');
const requireAuth = require('../../middleware/requireAuth');
const requireLogin = require('../../middleware/requireLogin');

/** add a client */
router.post('/api/add-client', requireAuth, client_controller.add_client)

/** get all clients */
router.get('/api/list-client', requireAuth, client_controller.get_all_client)

/** update client information */
router.put('/api/update-client/:id', requireAuth, client_controller.update_client)

/** delete a client */
router.delete('/api/delete-client/:id', requireAuth, client_controller.delete_client)

module.exports = router