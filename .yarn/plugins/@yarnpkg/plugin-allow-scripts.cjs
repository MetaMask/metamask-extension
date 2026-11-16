/* eslint-disable */
//prettier-ignore
module.exports = {
name: "@yarnpkg/plugin-allow-scripts",
factory: function (require) {
var plugin=(()=>{var r=Object.defineProperty;var a=Object.getOwnPropertyDescriptor;var i=Object.getOwnPropertyNames;var p=Object.prototype.hasOwnProperty;var u=(o=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(o,{get:(e,l)=>(typeof require<"u"?require:e)[l]}):o)(function(o){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+o+'" is not supported')});var c=(o,e)=>{for(var l in e)r(o,l,{get:e[l],enumerable:!0})},f=(o,e,l,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let t of i(e))!p.call(o,t)&&t!==l&&r(o,t,{get:()=>e[t],enumerable:!(n=a(e,t))||n.enumerable});return o};var d=o=>f(r({},"__esModule",{value:!0}),o);var g={};c(g,{default:()=>x});var s=u("@yarnpkg/shell"),m=async(o,e)=>{if(e.mode==="update-lockfile")return;let l=await(0,s.execute)("yarn run allow-scripts");l!==0&&process.exit(l)},k={hooks:{afterAllInstalled:m}},x=k;return d(g);})();
return plugin;
}
};
