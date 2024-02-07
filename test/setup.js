require('@babel/register');
require('module-alias/register');
require('ts-node').register({ transpileOnly: true });
require('./helpers/setup-helper');

window.SVGPathElement = window.SVGPathElement || { prototype: {} };
global.indexedDB = {};
