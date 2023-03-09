const bcrypt = require('bcrypt')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const User = require('../models/user')
const Post = require('../models/post')

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
  },
  createPost: async ({ postInput }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated')
      error.code = 401
      throw error
    }

    const { title, content, imageUrl } = { ...postInput }

    const [emptyTitle, shortTitle] = [
      validator.isEmpty(title),
      !validator.isLength(title, { min: 4 })
    ]
    const [emptyContent, shortContent] = [
      validator.isEmpty(content),
      !validator.isLength(content, { min: 4 })
    ]

    const errors = []
    if (emptyTitle || shortTitle) errors.push({ message: 'Title is invalid' })
    if (emptyContent || shortContent)
      errors.push({ message: 'Content is invalid' })

    if (errors.length > 0) {
      const error = new Error('Invalid input')
      error.code = 422
      error.data = errors
      throw error
    }

    const user = await User.findById(req.userId)
    if (!user) {
      const error = new Error('Invalid User')
      error.code = 401
      throw error
    }

    const post = new Post({
      title,
      content,
      imageUrl,
      creator: user
    })

    const createdPost = await post.save()
    user.posts.push(createdPost)
    await user.save()

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toLocaleString(),
      updatedAt: createdPost.updatedAt.toLocaleString()
    }
  },
  posts: async (args, req) => {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated')
      error.code = 401
      throw error
    }

    const totalPosts = await Post.find().countDocuments()
    const posts = await Post.find().sort({ createdAt: -1 }).populate('creator')
    const formatedPosts = posts.map(post => ({
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toLocaleString(),
      updatedAt: post.updatedAt.toLocaleString()
    }))

    return { posts: formatedPosts, totalPosts }
  }
}
