const express = require('express')
const { body } = require('express-validator/check')
const User = require('../models/user')
const authController = require('../controllers/auth')

const router = express.Router()

router.put(
  '/signup',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please enter email')
      .custom((value, { req }) =>
        User.findOne({ email: value }).then(user => {
          if (user) return Promise.reject('E-mail address already exists')
        })
      )
      .normalizeEmail(),
    body('name').trim().not().isEmpty(),
    body('password').trim().notEmpty().isLength({ min: 5 })
  ],
  authController.signup
)
router.post('/login', authController.login)

module.exports = router
