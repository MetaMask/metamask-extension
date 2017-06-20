const jsdom = require('jsdom').jsdom

global.document = jsdom('<!doctype html><html><body></body></html>')
global.window = document.defaultView
global.navigator = global.window.navigator

// hook({
//   generateScopedName: '[name]__[local]__[hash:base64:5]'
// })

// const jsdom = require('jsdom').jsdom
// const exposedProperties = ['window', 'navigator', 'document']

// global.document = jsdom('')
// global.window = document.defaultView
// Object.keys(document.defaultView).forEach((property) => {
//   if (typeof global[property] === 'undefined') {
//     exposedProperties.push(property)
//     global[property] = document.defaultView[property]
//   }
// })

// global.navigator = {
//   userAgent: 'node.js',
// }
