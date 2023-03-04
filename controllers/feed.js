const { validationResult } = require('express-validator/check')
const Post = require('../models/post')

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
  const { title, content } = { ...req.body }
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const error = new Error('Validation failed')
    error.statusCode = 422
    throw error
  }

  const post = new Post({
    title,
    content,
    creator: {
      name: 'Manolo'
    },
    imageUrl: 'images/pepe.jpg'
  })

  post
    .save()
    .then(result => {
      console.log(result)
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
