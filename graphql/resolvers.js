const bcrypt = require('bcrypt')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const User = require('../models/user')
const Post = require('../models/post')
const { clearImage } = require('../utils/utils')

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
  posts: async ({ page }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated')
      error.code = 401
      throw error
    }

    if (!page) page = 1

    const perPage = 2
    const totalPosts = await Post.find().countDocuments()
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('creator')
      .skip((page - 1) * perPage)
      .limit(perPage)
    const formatedPosts = posts.map(post => ({
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toLocaleString(),
      updatedAt: post.updatedAt.toLocaleString()
    }))

    return { posts: formatedPosts, totalPosts }
  },
  post: async ({ id }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated')
      error.code = 401
      throw error
    }

    const post = await Post.findById(id).populate('creator')
    if (!post) {
      const error = new Error('Post not found')
      error.code = 404
      throw error
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toLocaleString(),
      updatedAt: post.updatedAt.toLocaleString()
    }
  },
  updatePost: async ({ id, postInput }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated')
      error.code = 401
      throw error
    }

    const post = await Post.findById(id).populate('creator')
    if (!post) {
      const error = new Error('Post not found')
      error.code = 404
      throw error
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Not authorized')
      error.code = 403
      throw error
    }

    const { title, content, imageUrl } = { ...postInput }

    const errors = []
    const emptyTitle = validator.isEmpty(title)
    const shortTitle = !validator.isLength(title, { min: 4 })
    const emptyContent = validator.isEmpty(content)
    const shortContent = !validator.isLength(content, { min: 4 })
    if (emptyTitle || shortTitle) errors.push({ message: 'Title is invalid' })
    if (emptyContent || shortContent)
      errors.push({ message: 'Content is invalid' })

    if (errors.length > 0) {
      const error = new Error('Invalid input')
      error.data = errors
      error.code = 422
      throw error
    }

    post.title = title
    post.content = content
    if (imageUrl !== 'undefined') post.imageUrl = imageUrl

    const updatedPost = await post.save()
    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toLocaleString(),
      updatedAt: updatedPost.updatedAt.toLocaleString()
    }
  },
  deletePost: async ({ id }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not authenticated')
      error.code = 401
      throw error
    }

    const post = await Post.findById(id)
    if (!post) {
      const error = new Error('Post not found')
      error.code = 404
      throw error
    }
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error('not authorized')
      error.code = 403
      throw error
    }
    clearImage(post.imageUrl)
    await Post.findByIdAndRemove(id)

    const user = await User.findById(req.userId)
    user.posts.pull(id)
    await user.save()

    return true
  },
  user: async (args, req) => {
    if (!req.isAuth) {
      const error = new Error('Not authenticated')
      error.code = 401
      throw error
    }

    const user = await User.findById(req.userId)
    if (!user) {
      const error = new Error('User not found')
      error.code = 404
      throw error
    }

    return { ...user._doc, _id: user._id.toString() }
  }
}
