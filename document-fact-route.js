var express = require('express');
var router = express.Router();

const documentFactController = require('../../controllers/facturation/document-fact-controller');
const requireAuth = require('../../middleware/requireAuth');

/** get all fact documents */
router.get('/api/list-fact-documents', requireAuth, documentFactController.get_fact_documents)

/** creation d'une facture ou d'un devis */
router.post('/api/create-fact-document', requireAuth, documentFactController.generate_document_fact)

/** suppression du document */
router.delete('/api/delete-fact-document/:id', requireAuth, documentFactController.delete_fact_document)

/** modification du document */
router.put('/api/update-fact-document/:id', requireAuth, documentFactController.convert_facture)

/** selected client */
router.put('/api/get-selected-client', requireAuth, documentFactController.get_selected_client)

module.exports = router