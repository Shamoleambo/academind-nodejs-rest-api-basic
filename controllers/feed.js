const { validationResult } = require('express-validator/check')
const Post = require('../models/post')

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: '123',
        title: 'First Post',
        creator: {
          name: 'Mano'
        },
        createdAt: new Date(),
        content: 'Some Content',
        imageUrl: 'images/pepe.jpg'
      }
    ]
  })
}

exports.createPost = (req, res, next) => {
  const { title, content } = { ...req.body }
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res
      .status(422)
      .json({ message: 'Validation failed', errors: errors.array() })
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
    .catch(err => console.log(err))
}
