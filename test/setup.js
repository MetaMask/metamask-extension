require('@babel/register');

require('./helpers/setup-helper');

window.SVGPathElement = window.SVGPathElement || { prototype: {} };
global.indexedDB = {};
