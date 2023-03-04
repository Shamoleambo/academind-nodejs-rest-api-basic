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
  const [title, content] = [req.body.title, req.body.content]

  res.status(201).json({
    message: 'Post created!',
    post: {
      _id: '321',
      title,
      creator: {
        name: 'Mano'
      },
      createdAt: new Date(),
      content,
      imageUrl: 'images/pepe.jpg'
    }
  })
}
