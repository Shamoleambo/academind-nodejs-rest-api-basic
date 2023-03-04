exports.getPosts = (req, res, next) => {
  res.status(200).json()
}

exports.createPost = (req, res, next) => {
  const [title, content] = [req.body.title, req.body.content]

  res
    .status(201)
    .json({
      message: 'Post created!',
      post: { date: new Date().toLocaleString(), title, content }
    })
}
