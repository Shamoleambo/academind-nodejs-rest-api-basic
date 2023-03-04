const express = require('express')
const { body } = require('express-validator/check')
const feedController = require('../controllers/feed')
const router = express.Router()

router.get('/posts', feedController.getPosts)
router.post(
  '/post',
  [
    body('title').trim().isLength({ min: 5 }).withMessage('Title must have at least 5 characters'),
    body('content').trim().isLength({ min: 5 }).withMessage('Content must have at least five characters')
  ],
  feedController.createPost
)

module.exports = router
