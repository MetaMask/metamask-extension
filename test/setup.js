require('@babel/register')

require('./helper')

window.SVGPathElement = window.SVGPathElement || { prototype: {} }
global.indexedDB = {}
