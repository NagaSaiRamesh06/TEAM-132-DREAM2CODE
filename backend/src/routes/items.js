const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/itemController');

router.use(auth);
router.post('/', ctrl.createItem);
router.get('/', ctrl.getItems);
router.get('/:id', ctrl.getItem);
router.put('/:id', ctrl.updateItem);
router.delete('/:id', ctrl.deleteItem);

module.exports = router;
