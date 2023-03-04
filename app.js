const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const feedRoutes = require('./routes/feed')

dotenv.config()

const app = express()

app.use(bodyParser.json())

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, PUT')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})

app.use('/feed', feedRoutes)

mongoose
  .connect(process.env.URI_MONGO_DB)
  .then(() => {
    console.log('Connected to the database')
    app.listen(8080, () => {
      console.log('Your app is running on port 8080')
    })
  })
  .catch(err => console.log(err))
