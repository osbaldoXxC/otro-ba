const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const usuarioController = require('../controllers/usuarioController');

router.post('/register', upload.single('image'), usuarioController.registerUser);

module.exports = router;
