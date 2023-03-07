const { validationResult } = require('express-validator/check')
const bcrypt = require('bcrypt')
const User = require('../models/user')

exports.signup = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed')
    error.statusCode = 422
    error.data = errors.array()
    throw error
  }
  const { name, email, password } = { ...req.body }

  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const user = new User({ email, password: hashedPassword, name })
      return user.save()
    })
    .then(result => {
      res.status(201).json({ message: 'User created!', userId: result._id })
    })
    .catch(err => {
      if (!err.statusCode) err.statusCode = 500
      next(err)
    })
}
