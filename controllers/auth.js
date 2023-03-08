const { validationResult } = require('express-validator/check')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const User = require('../models/user')

dotenv.config()

exports.signup = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation Failed')
    error.statusCode = 422
    error.data = errors.array()
    throw error
  }
  const { name, email, password } = { ...req.body }

  try {
    const hashedPassword = await bcrypt.hash(password, 12)
    const user = new User({ email, password: hashedPassword, name })
    await user.save()

    res.status(201).json({ message: 'User created!', userId: user._id })
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500
    next(error)
  }
}

exports.login = async (req, res, next) => {
  const { email, password } = { ...req.body }

  try {
    const user = await User.findOne({ email })
    if (!user) {
      const error = new Error('No user with such email')
      error.statusCode = 401
      throw error
    }

    const passwordsMatch = await bcrypt.compare(password, user.password)
    if (!passwordsMatch) {
      const error = new Error('Wrong password')
      error.statusCode = 401
      throw error
    }

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString()
      },
      `${process.env.JWT_SECRET}`,
      { expiresIn: '1h' }
    )

    res.status(200).json({ token, userId: user._id.toString() })
  } catch (error) {
    if (!error.statusCode) error.statusCode = 500
    next(error)
  }
}
