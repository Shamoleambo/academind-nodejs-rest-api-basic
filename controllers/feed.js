const fs = require('fs')
const path = require('path')
const { validationResult } = require('express-validator/check')
const Post = require('../models/post')
const User = require('../models/user')

const clearImage = filePath => {
  fs.unlink(path.join(__dirname, '..', filePath), err => console.log(err))
}

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1
  const perPage = 2
  let totalItems

  Post.find()
    .countDocuments()
    .then(count => {
      totalItems = count
      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
    })
    .then(posts => {
      res.status(200).json({ message: 'Fetched posts', posts, totalItems })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500
      }
      next(err)
    })
}

exports.createPost = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed')
    error.statusCode = 422
    throw error
  }

  if (!req.file) {
    const error = new Error('No image provided')
    error.statusCode = 422
    throw error
  }

  const title = req.body.title
  const content = req.body.content
  const imageUrl = req.file.path.replace('\\', '/')
  let creator

  const post = new Post({
    title,
    content,
    creator: req.userId,
    imageUrl
  })

  post
    .save()
    .then(() => {
      return User.findById(req.userId)
    })
    .then(user => {
      creator = user
      user.posts.push(post)
      return user.save()
    })
    .then(result => {
      res.status(201).json({
        message: 'Post created!',
        post,
        creator: { _id: creator._id, name: creator.name }
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500
      }
      next(err)
    })
}

exports.getPost = (req, res, next) => {
  const postId = req.params.postId
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Post not found')
        error.statusCode = 404
        throw error
      }

      res.status(200).json({ message: 'Post fetched', post })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500
      }
      next(err)
    })
}

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed.')
    error.statusCode = 422
    throw error
  }

  const postId = req.params.postId
  const title = req.body.title
  const content = req.body.content
  let imageUrl

  if (req.file) {
    imageUrl = req.file.path.replace('\\', '/')
  } else imageUrl = req.body.image.replace('\\', '/')

  if (!imageUrl) {
    const error = new Error('No file picked.')
    error.statusCode = 422
    throw error
  }

  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('No post found.')
        error.statusCode = 404
        throw error
      }
      if (post.creator.toString() !== req.userId.toString()) {
        const error = new Error('Not authorized')
        error.statusCode = 403
        throw error
      }
      if (imageUrl !== post.imageUrl) clearImage(post.imageUrl)

      post.title = title
      post.content = content
      post.imageUrl = imageUrl

      return post.save()
    })
    .then(result => {
      res.status(200).json({ message: 'Post updated', post: result })
    })
    .catch(err => {
      if (!err.statusCode) err.statusCode = 500
      next(err)
    })
}

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId

  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('No post found')
        error.statusCode = 404
        throw error
      }
      if (post.creator.toString() !== req.userId.toString()) {
        const error = new Error('Not authorized')
        error.statusCode = 403
        throw error
      }

      clearImage(post.imageUrl)
      return Post.findByIdAndRemove(postId)
    })
    .then(() => {
      return User.findById(req.userId)
    })
    .then(user => {
      user.posts.pull(postId)
      return user.save()
    })
    .then(result => {
      console.log('Post deleted\n', result)
      res.status(200).json({ message: 'Post deleted', post: result })
    })
    .catch(err => {
      if (!err.statusCode) err.statusCode = 500
      next(err)
    })
}

exports.getStatus = (req, res, next) => {
  User.findById(req.userId)
    .then(user => {
      if (!user) {
        const error = new Error('User not found')
        error.statusCode = 404
        throw error
      }
      return user.status
    })
    .then(status => {
      res.status(200).json({ message: 'Status successfully retrieved', status })
    })
    .catch(error => {
      if (!error.statusCode) error.statusCode = 500
      next(error)
    })
}

exports.updateStatus = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Invalid status field')
    error.data = errors.array()
    error.statusCode = 422
    throw error
  }

  const status = req.body.status

  User.findById(req.userId)
    .then(user => {
      if (!user) {
        const error = new Error('User not found')
        error.statusCode = 404
        throw error
      }
      user.status = status
      return user.save()
    })
    .then(() => {
      console.log('Status updated')
      res.status(200).json({ message: 'User status updated!' })
    })
    .catch(err => {
      if (!err.statusCode) err.statusCode = 500
      next(err)
    })
}
