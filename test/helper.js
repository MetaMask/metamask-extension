var log = require('loglevel')
log.setDefaultLevel(5)

require('jsdom-global')()
window.localStorage = {}

if (!('crypto' in window)) { window.crypto = {} }
window.crypto.getRandomValues = require('polyfill-crypto.getrandomvalues')

window.log = log
global.log = log
