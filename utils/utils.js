const fs = require('fs')
const path = require('path')

const clearImage = filePath => {
  fs.unlink(path.join(__dirname, '..', filePath), err => console.log(err))
}

module.exports = { clearImage }
