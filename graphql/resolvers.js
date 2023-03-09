const bcrypt = require('bcrypt')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const User = require('../models/user')

dotenv.config()

module.exports = {
  createUser: async function ({ userInput }, req) {
    const errors = []
    if (!validator.isEmail(userInput.email))
      errors.push({ message: 'E-mail is invalid' })
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    )
      errors.push({ message: 'Invalid password' })

    if (errors.length > 0) {
      const error = new Error('Invalid Input')
      error.data = errors
      error.code = 422
      throw error
    }

    const existingUser = await User.findOne({ email: userInput.email })
    if (existingUser) {
      const error = new Error('User already exists')
      throw error
    }

    const hashedPassword = await bcrypt.hash(userInput.password, 12)
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPassword
    })
    const createdUser = await user.save()

    return { ...createdUser._doc, _id: createdUser._id.toString() }
  },
  login: async ({ email, password }, req) => {
    const user = await User.findOne({ email })
    if (!user) {
      const error = new Error('User not found')
      error.code = 401
      throw error
    }

    const passwordsMatch = await bcrypt.compare(password, user.password)
    if (!passwordsMatch) {
      const error = new Error('Wrong password')
      error.code = 401
      throw error
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    return { token, userId: user._id.toString() }
  }
}
