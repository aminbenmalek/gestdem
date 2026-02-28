
const express = require('express');
const router = express.Router();
const { login, signup } = require('../controllers/authController');

// @route   POST api/auth/signup
// @desc    Inscrire une nouvelle société
router.post('/signup', signup);

// @route   POST api/auth/login
// @desc    Authentifier une société & obtenir le token
router.post('/login', login);

module.exports = router;
