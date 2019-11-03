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
  var Widget = function () {
    function a (b) {
      var c = !!(1 < arguments.length && void 0 !== arguments[1]) && arguments[1];
      _classCallCheck(this,a), this.debug = c, this.operationHostedWidget="debitcard-hosted", this.operationHostedDialogWidget="debitcard-hosted-dialog", this.operationWidgetLite="debitcard-whitelabel",this.operationDigitalWallet="debitcard",this.operationAch="onramp",this.validOperations=[this.operationWidgetLite,this.operationDigitalWallet,this.operationHostedWidget,this.operationAch,this.operationHostedDialogWidget],this.injectedWidgetOperations=[this.operationWidgetLite,this.operationDigitalWallet],this.iframeWidgetOperations=[this.operationAch],this.queue=[],this.ready=!1,this.eventRegistrations=new Map,null==b.env&&(b.env="production"),this.initParams=b,this.init=this.processClassicInit(b);
      var d=b;
      console.log("init",b,d),this.getNewWidgetScriptLocation(),this.operationType=d.operation&&d.operation.type||"",this.validateOperationType(),this.injectedWidgetOperations.includes(this.operationType)?(console.log("inject run"),this.attachEvents(),this.createInjectedWidget()):this.iframeWidgetOperations.includes(this.operationType)?(console.log("iframe run"),this.validateInit(),this.attachEvents(),this.createIframe()):this.operationHostedWidget===this.operationType?this.handleHostedWidget():this.operationHostedDialogWidget===this.operationType&&this.emit("ready");
    }
    return _createClass(
      a,
      [
        {key:"validateOperationType",value:function a(){if(!this.validOperations.includes(this.operationType)){var b="supplied operation type >>"+this.operationType+"<< is invalid, valid types are:"+this.validOperations.join(",").toString();throw this.emit("close",{error:b}),this.removeClass(),new Error(b)}}},
        {key:"removeListener",value:function d(a,b){var c=this.eventRegistrations.get(a)||[];c=c.filter(function(a){return a!==b}),this.eventRegistrations.set(a,c);}},
        {key:"removeAllListeners",value:function b(a){a?this.eventRegistrations.set(a,[]):this.eventRegistrations=new Map;}},
        {key:"on",value:function d(a,b){if(!a)throw new Error("must supply an event!");var c=this.eventRegistrations.get(a)||[];c.push(b),this.eventRegistrations.set(a,c);}},
        {key:"open",value:function a(){return this.send("open",{}),console.log(this.operationType),this.operationType==this.operationHostedDialogWidget?void this.handleHostedDialogWidget():void(this.iframe?this.iframe.style.display="block":this.injectedWidget&&(this.injectedWidget.style.display="block"))}},
        {key:"emit",value:function d(a,b){var c=this.eventRegistrations.get(a)||[];c.forEach(function(a){try{a(b||{});}catch(a){console.warn("subscribed widget event handler failure: ",a);}});}},
        {key:"validateInit",value:function a(){switch(this.init.auth.type){case"secretKey":if(this.init.error)return;var b=this.init.auth.secretKey;if(25>b.length)return console.error("Diligently refusing to accept a secret key with length < 25"),this.emit("close",{error:"supplied secretKey is too short"}),void this.removeClass();}}},
        {key:"send",value:function c(a,b){this.queue.push({type:a,payload:b}),this.flush();}},
        {key:"flush",value:function b(){var a=this;this.ready&&(this.queue.forEach(function(b){return a.iframe.contentWindow.postMessage(JSON.stringify(b),"*")}),this.queue=[]);}},
        {key:"attachEvents",value:function d(){var a=this,b=window.addEventListener?"addEventListener":"attachEvent",c="attachEvent"==b?"onmessage":"message";window[b](c,function(b){if("string"==typeof b.data&&0==b.data.indexOf("{")){var c=JSON.parse(b.data);if(console.log("frame",c),!!c.type)switch(c.type){case"ready":a.ready=!0,a.init.web3PresentInParentButNotChild=c.payload&&!c.payload.web3Enabled&&"undefined"!=typeof web3,"function"==typeof ga&&c.payload&&c.payload.gaTrackingCode?(ga("create",c.payload.gaTrackingCode,"auto"),ga(function(b){var c=b.get("clientId");a.send("init",a.init),a.emitReady();})):(a.send("init",a.init),a.emitReady());break;case"close":case"complete":a.close(),a.removeClass(),a.emit(c.type,c.payload);break;case"sign-request":var d=c.payload,e=new Web3(web3.currentProvider);e.personal.sign(e.fromUtf8(d.message),d.address,function(b,c){a.send("sign-response",{signature:c,error:b});});break;case"provider-name":var h=a.getNameOfProvider();a.send("provider-name",h);break;case"accounts":var f=new Web3(web3.currentProvider),g=f.eth.accounts;a.send("accounts-response",{accounts:g});break;default:}}},!1);}},
        {key:"close",value:function a(){this.removeClass(),this.iframe&&document.body.removeChild(this.iframe),this.injectedWidget&&document.body.removeChild(this.injectedWidget),this.injectedWidget=null,this.iframe=null,this.queue=[],this.ready=!1;}},
        {key:"createIframe",value:function b(){var a=Math.round;this.iframe=document.createElement("iframe"),this.iframe.setAttribute("allow","camera;"),this.iframe.style.display="none",this.iframe.style.border="none",this.iframe.style.width="100%",this.iframe.style.height="100%",this.iframe.style.position="fixed",this.iframe.style.zIndex="999999",this.iframe.style.top="0",this.iframe.style.left="0",this.iframe.style.bottom="0",this.iframe.style.right="0",this.iframe.style.backgroundColor="transparent",this.iframe.src=this.getBaseUrl()+"/loader?_cb="+a(new Date().getTime()/1e3),document.body.appendChild(this.iframe);}},
        {key:"getBaseUrl",value:function a(){switch(this.init.env){case"test":return "https://verify.testwyre.com";case"staging":return "https://verify-staging.i.sendwyre.com";case"local":return "http://localhost:8890";case"local_https":return "https://localhost:8890";case"android_emulator":return "http://10.0.2.2:8890";case"production":default:return "https://verify.sendwyre.com";}}},
        {key:"processClassicInit",value:function d(a){if(a.auth)return a;var b=a,c={env:b.env,auth:{type:"metamask"},operation:{type:"onramp",destCurrency:b.destCurrency},apiKey:b.apiKey,web3PresentInParentButNotChild:!1};return b.onExit&&this.on("close",function(a){a.error?(b.onExit(a.error),this.removeClass()):(this.removeClass(),b.onExit(null));}),b.onSuccess&&(this.on("complete",function(){b.onSuccess();}),this.removeClass()),console.debug("converted v1 config to v2, please use this instead: ",c),c}},
        {key:"getNameOfProvider",value:function a(){return web3.currentProvider.isTrust?"trust":"undefined"==typeof __CIPHER__?"undefined"==typeof SOFA?web3.currentProvider.isDDEXWallet?"ddex":"metamask":"coinbase":"cipher"}},
        {key:"getOperationParametersAsQueryString",value:function b(){var a=this;return this.initParams.operation?Object.keys(this.initParams.operation).map(function(b){return b+"="+encodeURIComponent(a.initParams.operation[b])}).join("&"):""}},
        {key:"handleHostedWidget",value:function a(){location.href=this.getPayWidgetLocation()+"/purchase?"+this.getOperationParametersAsQueryString();}},
        {key:"handleHostedDialogWidget",value:function f(){var a=this,b=this.getPayWidgetLocation()+"/purchase?"+this.getOperationParametersAsQueryString(),c=this.openAndCenterDialog(b,360,650),d=window.addEventListener?"addEventListener":"attachEvent",e="attachEvent"===d?"onmessage":"message";window[d](e,function(b){"paymentSuccess"===b.data.type&&a.emit("paymentSuccess",{data:b.data});},!1);}},
        {key:"openAndCenterDialog",value:function o(a,b,c){var d=navigator.userAgent,e=function(){return /\b(iPhone|iP[ao]d)/.test(d)||/\b(iP[ao]d)/.test(d)||/Android/i.test(d)||/Mobile/i.test(d)},f="undefined"==typeof window.screenX?window.screenLeft:window.screenX,g="undefined"==typeof window.screenY?window.screenTop:window.screenY,h="undefined"==typeof window.outerWidth?document.documentElement.clientWidth:window.outerWidth,i="undefined"==typeof window.outerHeight?document.documentElement.clientHeight-22:window.outerHeight,j=e()?null:b,k=e()?null:c,l=0>f?window.screen.width+f:f,m=[];null!==j&&m.push("width="+j),null!==k&&m.push("height="+k),m.push("left="+(l+(h-j)/2)),m.push("top="+(g+(i-k)/2.5)),m.push("scrollbars=1");var n=window.open(a,"Wyre",m.join(","));return window.focus&&n.focus(),n}},
        {key:"getPayWidgetLocation",value:function a(){switch(this.initParams.env){case"test":return "https://pay.testwyre.com";case"staging":return "https://pay-staging.i.sendwyre.com";case"local":return "http://localhost:3000";case"production":default:return "https://pay.sendwyre.com";}}},
        {key:"getNewWidgetScriptLocation",value:function a(){return this.operationType===this.operationWidgetLite?this.getPayWidgetLocation()+"/widget-lite/static/js/widget-lite.js":this.getPayWidgetLocation()+"/digital-wallet-embed.js"}},
        {key:"createInjectedWidget",value:function a(){switch(this.operationType){case"debitcard":{if(this.injectedWidget=document.getElementById("wyre-dropin-widget-container"),!this.injectedWidget){throw this.emit("close",{error:"unable to mount the widget did with id `wyre-dropin-widget-container`  not found"}),this.removeClass(),new Error("unable to mount the widget did with id `wyre-dropin-widget-container`  not found")}this.injectedWidget.style.display="none",this.handleDebitcardInjection();break}case"debitcard-whitelabel":{if(this.injectedWidget=document.getElementById("wyre-dropin-widget-container"),!this.injectedWidget){throw this.emit("close",{error:"unable to mount the widget did with id `wyre-dropin-widget-container`  not found"}),this.removeClass(),new Error("unable to mount the widget did with id `wyre-dropin-widget-container`  not found")}this.injectedWidget.style.display="none",this.handleDebitcardWhiteLabelInjection();break}}}},
        {key:"loadJSFile",value:function b(a){return new Promise(function(b,c){var d=document.createElement("script");d.type="text/javascript",d.src=a,d.onload=b,d.onerror=c,d.async=!0,document.getElementsByTagName("head")[0].appendChild(d);})}},
        {key:"handleDebitcardInjection",value:function b(){var a=this;this.loadJSFile(this.getNewWidgetScriptLocation()).then(function(){DigitalWallet.init("wyre-dropin-widget-container",{type:a.operationType,dest:a.initParams.operation.dest,destCurrency:a.initParams.operation.destCurrency,sourceAmount:a.initParams.operation.sourceAmount,paymentMethod:a.initParams.operation.paymentMethod,accountId:a.initParams.accountId},function(b){a.emit("complete",b),a.removeClass();},function(b){a.emit("close",{error:b}),a.removeClass();}),a.send("init",a.init),a.emitReady();}).catch(function(b){throw a.emit("close",{error:b}),a.removeClass(),new Error(b)});}},
        {key:"handleDebitcardWhiteLabelInjection",value:function b(){var a=this;this.loadJSFile(this.getNewWidgetScriptLocation()).then(function(){Wyre2.setData&&Wyre2.widgetLite.appLoaded&&(Wyre2.setData(a.initParams.operation.paymentMethod,a.initParams.operation.sourceAmount,"USD",a.initParams.operation.destCurrency,a.initParams.operation.dest),Wyre2.registerCallback(function(a){this.send("paymentAuthorized",a);},function(a){this.send("error",a),this.removeClass(),console.log(JSON.stringify(a));}),a.send("init",a.init),a.emitReady());}).catch(function(b){throw a.emit("close",{error:b}),a.removeClass(),new Error(b)});}},
        {key:"updateData",value:function e(a,b,c,d){if(this.operationType==this.operationWidgetLite)Wyre2.setData&&Wyre2.widgetLite.appLoaded&&(Wyre2.setData(a,b,"USD",c,d),this.emitReady());else throw this.removeClass(),new Error("this can only be called for operation type "+this.operationWidgetLite)}},
        {key:"emitReady",value:function a(){this.setClassName(),this.emit("ready");}},{key:"removeComponent",value:function a(){}},{key:"setClassName",value:function d(){var a,b,c;a=document.getElementById("wyre-dropin-widget-container"),b="wyre-dropin-widget-container",c=a.className.split(" "),-1==c.indexOf(b)&&(a.className+=" "+b);}},{key:"removeClass",value:function b(){document.getElementById("wyre-dropin-widget-container").style.display="none";var a=document.getElementById("wyre-dropin-widget-container");a.className=a.className.replace(/\bwyre-dropin-widget-container\b/g,"");}}
      ]
    ),a
  }()
  var widget=Object.assign(Widget,{Widget:Widget});
  return widget;
}

function openWyre(address) {
  const Wyre = createWyreWidget()
  const widget = new Wyre({
    env: 'prod',
    operation: {
      type: 'debitcard-hosted-dialog',
      destCurrency: 'ETH',
      dest: `ethereum:${address}`,
    },
  })

  widget.open()
}

module.exports = openWyre