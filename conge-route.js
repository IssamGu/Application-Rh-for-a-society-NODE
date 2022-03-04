var express = require('express');
var router = express.Router();

const conge_controller = require('../controllers/conge-contoller')
const requireAuth = require('../middleware/requireAuth')

router.get('/api/get-all-conge', requireAuth, conge_controller.get_all_conge)

router.post('/api/ask-conge',requireAuth, conge_controller.ask_conge)

router.get('/api/askedByMe', requireAuth, conge_controller.asked_by_me)

router.put('/api/change-statut/:id', requireAuth, conge_controller.manage_conge)

router.get('/api/my-non-treated-conge', requireAuth, conge_controller.get_MyNonTreatedConge)

router.get('/api/get-non-treated-conge', requireAuth, conge_controller.getNonTreatedConge)


module.exports = router