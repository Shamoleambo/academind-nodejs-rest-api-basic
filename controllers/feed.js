const fs = require('fs')
const path = require('path')
const { validationResult } = require('express-validator/check')
const Post = require('../models/post')

const clearImage = filePath => {
  fs.unlink(path.join(__dirname, '..', filePath), err => console.log(err))
}

exports.getPosts = (req, res, next) => {
  Post.find()
    .then(posts => {
      res.status(200).json({ message: 'Fetched posts', posts })
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

  const post = new Post({
    title,
    content,
    creator: {
      name: 'Manolo'
    },
    imageUrl
  })

  post
    .save()
    .then(result => {
      res.status(201).json({ message: 'Post created!', post: result })
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
        error.statusCode = 422
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
      const error = new Error(err)
      error.statusCode = 500
      next(error)
    })
}
