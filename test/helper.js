require('jsdom-global')()
window.localStorage = {}

if (!('crypto' in window)) { window.crypto = {} }
window.crypto.getRandomValues = require('polyfill-crypto.getrandomvalues')
