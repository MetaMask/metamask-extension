require('@babel/register');
require('ts-node').register({ transpileOnly: true });

require('./helpers/setup-helper');

window.SVGPathElement = window.SVGPathElement || { prototype: {} };
global.indexedDB = {};
// scrollIntoView is not available in JSDOM
window.HTMLElement.prototype.scrollIntoView = () => undefined
