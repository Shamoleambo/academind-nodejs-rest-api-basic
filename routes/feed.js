const express = require('express')
const { body } = require('express-validator/check')
const feedController = require('../controllers/feed')
const router = express.Router()

router.get('/posts', feedController.getPosts)
router.post(
  '/post',
  [
    body('title')
      .trim()
      .isLength({ min: 4 })
      .withMessage('Title must have at least 4 characters'),
    body('content')
      .trim()
      .isLength({ min: 4 })
      .withMessage('Content must have at least 4 characters')
  ],
  feedController.createPost
)
router.get('/post/:postId', feedController.getPost)
router.put(
  '/post/:postId',
  [
    body('title')
      .trim()
      .isLength({ min: 4 })
      .withMessage('Title must have at least 4 characters'),
    body('content')
      .trim()
      .isLength({ min: 4 })
      .withMessage('Content must have at least 4 characters')
  ],
  feedController.updatePost
)
router.delete('/post/:postId', feedController.deletePost)

module.exports = router
