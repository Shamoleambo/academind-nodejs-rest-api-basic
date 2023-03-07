const express = require('express')
const { body } = require('express-validator/check')
const feedController = require('../controllers/feed')
const isAuth = require('../middleware/is-auth')
const router = express.Router()

router.get('/posts', isAuth, feedController.getPosts)
router.post(
  '/post',
  isAuth,
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
router.get('/post/:postId', isAuth, feedController.getPost)
router.put(
  '/post/:postId',
  isAuth,
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
router.delete('/post/:postId', isAuth, feedController.deletePost)

module.exports = router
