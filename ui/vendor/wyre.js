/* eslint-disable */
// code taken from https://verify.sendwyre.com/js/verify-module-init-beta.js
'use strict'

function _classCallCheck (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function')
  }
}

function _defineProperties (target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i]
    descriptor.enumerable = descriptor.enumerable || false
    descriptor.configurable = true
    if ('value' in descriptor) descriptor.writable = true
    Object.defineProperty(target, descriptor.key, descriptor)
  }
}

function _createClass (Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps)
  if (staticProps) _defineProperties(Constructor, staticProps)
  return Constructor
}

function createWyreWidget () {
  var ga = null
  var Widget=function(){function a(b){var c=!!(1<arguments.length&&void 0!==arguments[1])&&arguments[1];_classCallCheck(this,a),this.debug=c,this.queue=[],this.ready=!1,this.eventRegistrations=new Map,null==b.env&&(b.env="production"),this.init=this.processClassicInit(b),this.validateInit(),this.attachEvents(),this.configureGoogleAnalytics(),this.createIframe();}return _createClass(a,[{key:"removeListener",value:function d(a,b){var c=this.eventRegistrations.get(a)||[];c=c.filter(function(a){return a!==b}),this.eventRegistrations.set(a,c);}},{key:"removeAllListeners",value:function b(a){a?this.eventRegistrations.set(a,[]):this.eventRegistrations=new Map;}},{key:"on",value:function d(a,b){if(!a)throw new Error("must supply an event!");var c=this.eventRegistrations.get(a)||[];c.push(b),this.eventRegistrations.set(a,c);}},{key:"open",value:function a(){this.iframe?this.send("open",{}):this.createIframe(),this.iframe.style.display="block";}},{key:"emit",value:function d(a,b){var c=this.eventRegistrations.get(a)||[];c.forEach(function(a){try{a(b||{});}catch(a){console.warn("subscribed widget event handler failure: ",a);}});}},{key:"validateInit",value:function a(){switch(this.init.auth.type){case"secretKey":if(this.init.error)return;var b=this.init.auth.secretKey;if(25>b.length)return console.error("Diligently refusing to accept a secret key with length < 25"),void this.emit("close",{error:"supplied secretKey is too short"});}}},{key:"send",value:function c(a,b){this.queue.push({type:a,payload:b}),this.flush();}},{key:"flush",value:function b(){var a=this;this.ready&&(this.queue.forEach(function(b){return a.iframe.contentWindow.postMessage(JSON.stringify(b),"*")}),this.queue=[]);}},{key:"attachEvents",value:function d(){var a=this,b=window.addEventListener?"addEventListener":"attachEvent",c="attachEvent"==b?"onmessage":"message";window[b](c,function(b){if("string"==typeof b.data&&0==b.data.indexOf("{")){var c=JSON.parse(b.data);if(c.type)switch(c.type){case"ready":a.ready=!0,a.init.web3PresentInParentButNotChild=c.payload&&!c.payload.web3Enabled&&"undefined"!=typeof web3,"function"==typeof ga&&c.payload&&c.payload.gaTrackingCode?(ga("create",c.payload.gaTrackingCode,"auto"),ga(function(b){var c=b.get("clientId");a.init.googleAnalyticsClientId=c,a.init.googleAnalyticsReferrer=document.referrer,a.send("init",a.init),a.emit("ready");})):(a.send("init",a.init),a.emit("ready"));break;case"close":case"complete":a.close(),a.emit(c.type,c.payload);break;case"sign-request":var d=c.payload,e=new Web3(web3.currentProvider);e.personal.sign(e.fromUtf8(d.message),d.address,function(b,c){a.send("sign-response",{signature:c,error:b});});break;case"provider-name":var h=a.getNameOfProvider();a.send("provider-name",h);break;case"accounts":var f=new Web3(web3.currentProvider),g=f.eth.accounts;a.send("accounts-response",{accounts:g});break;default:}}},!1);}},{key:"close",value:function a(){document.body.removeChild(this.iframe),this.iframe=null,this.queue=[],this.ready=!1;}},{key:"createIframe",value:function b(){var a=Math.round;this.iframe=document.createElement("iframe"),this.iframe.setAttribute("allow","camera;"),this.iframe.style.display="none",this.iframe.style.border="none",this.iframe.style.width="100%",this.iframe.style.height="100%",this.iframe.style.position="fixed",this.iframe.style.zIndex="999999",this.iframe.style.top="0",this.iframe.style.left="0",this.iframe.style.bottom="0",this.iframe.style.right="0",this.iframe.style.backgroundColor="transparent",this.iframe.src=this.getBaseUrl()+"/loader?_cb="+a(new Date().getTime()/1e3),document.body.appendChild(this.iframe);}},{key:"getBaseUrl",value:function a(){switch(this.init.env){case"test":return "https://verify.testwyre.com";case"staging":return "https://verify-staging.i.sendwyre.com";case"local":return "http://localhost:8890";case"local_https":return "https://localhost:8890";case"android_emulator":return "http://10.0.2.2:8890";case"production":default:return "https://verify.sendwyre.com";}}},{key:"processClassicInit",value:function d(a){if(a.auth)return a;var b=a,c={env:b.env,auth:{type:"metamask"},operation:{type:"onramp",destCurrency:b.destCurrency},apiKey:b.apiKey,web3PresentInParentButNotChild:!1};return b.onExit&&this.on("close",function(a){a.error?b.onExit(a.error):b.onExit(null);}),b.onSuccess&&this.on("complete",function(){b.onSuccess();}),console.debug("converted v1 config to v2, please use this instead: ",c),c}},{key:"configureGoogleAnalytics",value:function b(){try{if("function"==typeof ga)return}catch(b){var a=document.createElement("script");a.setAttribute("src","https://www.google-analytics.com/analytics.js"),document.head.appendChild(a);}}},{key:"getNameOfProvider",value:function a(){return web3.currentProvider.isTrust?"trust":"undefined"==typeof __CIPHER__?"undefined"==typeof SOFA?web3.currentProvider.isDDEXWallet?"ddex":"metamask":"coinbase":"cipher"}}]),a}(),widget=Object.assign(Widget,{Widget:Widget});

  return widget;
}

function openWyre(address) {
  const Wyre = createWyreWidget()
  const widget = new Wyre({
    env: 'prod',
    auth: {
      type: 'metamask'
    },
    operation: {
      type: 'onramp',
      destCurrency: 'ETH',
      dest: `ethereum:${address}`,
    },
  })

  widget.open()
}

module.exports = openWyre