var express = require('express');
var router = express.Router();

const document_rh_controller = require('../controllers/document-rh-controller');
const requireAuth = require('../middleware/requireAuth');
const requireLogin = require('../middleware/requireLogin');

/** ask for a human resource document */
router.post('/api/ask-for-document', requireAuth, document_rh_controller.ask_document)

/** get my asked documents */
router.get('/api/get-my-documents', requireAuth, document_rh_controller.get_my_documents)

/** Responsable: generate the asked document */
router.put('/api/generate-document/:id', requireAuth ,document_rh_controller.generate_document)

/** Responsable: Get employee demands  */
router.get('/api/get-all-demands',  requireAuth ,document_rh_controller.get_all_demands)

/** Responsable: Delete one document */
router.delete('/api/delete-document/:id', requireAuth , document_rh_controller.delete_document)

/** get not treated demands */
router.get('/api/get-non-treated', requireAuth, document_rh_controller.get_nonTreatedDocuments)

module.exports = router