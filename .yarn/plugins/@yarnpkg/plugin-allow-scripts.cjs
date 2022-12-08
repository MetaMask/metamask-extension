/* eslint-disable */
//prettier-ignore
module.exports = {
name: "@yarnpkg/plugin-allow-scripts",
factory: function (require) {
var plugin=(()=>{var a=Object.create,l=Object.defineProperty;var i=Object.getOwnPropertyDescriptor;var s=Object.getOwnPropertyNames;var p=Object.getPrototypeOf,c=Object.prototype.hasOwnProperty;var u=e=>l(e,"__esModule",{value:!0});var f=e=>{if(typeof require!="undefined")return require(e);throw new Error('Dynamic require of "'+e+'" is not supported')};var g=(e,o)=>{for(var r in o)l(e,r,{get:o[r],enumerable:!0})},m=(e,o,r)=>{if(o&&typeof o=="object"||typeof o=="function")for(let t of s(o))!c.call(e,t)&&t!=="default"&&l(e,t,{get:()=>o[t],enumerable:!(r=i(o,t))||r.enumerable});return e},x=e=>m(u(l(e!=null?a(p(e)):{},"default",e&&e.__esModule&&"default"in e?{get:()=>e.default,enumerable:!0}:{value:e,enumerable:!0})),e);var k={};g(k,{default:()=>d});var n=x(f("@yarnpkg/shell")),y={hooks:{afterAllInstalled:async()=>{let e=await(0,n.execute)("yarn run allow-scripts");e!==0&&process.exit(e)}}},d=y;return k;})();
return plugin;
}
};
