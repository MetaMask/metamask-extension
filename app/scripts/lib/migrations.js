var path = require('path')
var fs = require('fs')

var migration2 = require('../migrations/002')
var migration3 = require('../migrations/003')

module.exports = [
  migration2,
  migration3,
]
