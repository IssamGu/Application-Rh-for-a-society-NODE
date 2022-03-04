var express = require('express');
var router = express.Router();

var user_controller = require('../controllers/user-controller');
const requireAuth = require('../middleware/requireAuth');

/** get employees list : responsable + manager */
router.get('/api/allemployee', user_controller.user_list)

/** get the employee by his id */
router.get('/api/showuserprofile/:id', user_controller.get_user)

/** add an employee admin + responsable RH */
router.post('/api/adduser' , user_controller.add_user)

/** delete an employee account */
router.delete('/api/deleteuser/:id', user_controller.delete_user)

/** update an employee profile */
router.put('/api/updateuser/:id', requireAuth, user_controller.update_user)

module.exports = router