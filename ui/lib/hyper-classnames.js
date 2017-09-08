const classnames = require('classnames')

module.exports = (...args) => classnames(...args).split(' ').join('.')
