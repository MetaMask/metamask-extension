/* eslint-disable */
// code taken from https://verify.sendwyre.com/js/widget-loader.js
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
  var Widget = (function () { function a (b) { var c = !!(arguments.length > 1 && void 0 !== arguments[1]) && arguments[1]; _classCallCheck(this, a), this.debug = c, this.queue = [], this.ready = !1, this.eventRegistrations = new Map(), b.env == null && (b.env = 'production'), this.init = this.processClassicInit(b), this.validateInit(), this.attachEvents(), this.createIframe() } return _createClass(a, [{key: 'removeListener', value: function d (a, b) { var c = this.eventRegistrations.get(a) || []; c = c.filter(function (a) { return a !== b }), this.eventRegistrations.set(a, c) }}, {key: 'removeAllListeners', value: function b (a) { a ? this.eventRegistrations.set(a, []) : this.eventRegistrations = new Map() }}, {key: 'on', value: function d (a, b) { if (!a) throw new Error('must supply an event!'); var c = this.eventRegistrations.get(a) || []; c.push(b), this.eventRegistrations.set(a, c) }}, {key: 'open', value: function a () { this.iframe ? this.send('open', {}) : this.createIframe(), this.iframe.style.display = 'block' }}, {key: 'emit', value: function d (a, b) { var c = this.eventRegistrations.get(a) || []; c.forEach(function (a) { try { a(b || {}) } catch (a) { console.warn('subscribed widget event handler failure: ', a) } }) }}, {key: 'validateInit', value: function a () { switch (this.init.auth.type) { case 'secretKey':var b = this.init.auth.secretKey; if (b.length < 25) return console.error('Diligently refusing to accept a secret key with length < 25'), void this.emit('close', {error: 'supplied secretKey is too short'}) } }}, {key: 'send', value: function c (a, b) { this.queue.push({type: a, payload: b}), this.flush() }}, {key: 'flush', value: function b () { var a = this; this.ready && (this.queue.forEach(function (b) { return a.iframe.contentWindow.postMessage(JSON.stringify(b), '*') }), this.queue = []) }}, {key: 'attachEvents', value: function d () { var a = this, b = window.addEventListener ? 'addEventListener' : 'attachEvent', c = b == 'attachEvent' ? 'onmessage' : 'message'; window[b](c, function (b) { if (typeof b.data === 'string') { var c = JSON.parse(b.data); if (c.type) switch (c.type) { case 'ready':a.ready = !0, ga && c.payload && c.payload.gaTrackingCode ? (ga('create', c.payload.gaTrackingCode, 'auto'), ga(function (b) { var c = b.get('clientId'); a.init.googleAnalyticsClientId = c, a.send('init', a.init), a.emit('ready') })) : (a.send('init', a.init), a.emit('ready')); break; case 'close':case 'complete':a.close(), a.emit(c.type, c.payload); break; case 'sign-request':var d = c.payload, e = new Web3(web3.currentProvider); e.personal.sign(e.fromUtf8(d.message), d.address, function (b, c) { a.send('sign-response', {signature: c, error: b}) }); break; default: } } }, !1) }}, {key: 'close', value: function a () { document.body.removeChild(this.iframe), this.iframe = null, this.queue = [], this.ready = !1 }}, {key: 'createIframe', value: function b () { var a = Math.round; this.iframe = document.createElement('iframe'), this.iframe.style.display = 'none', this.iframe.style.border = 'none', this.iframe.style.width = '100%', this.iframe.style.height = '100%', this.iframe.style.position = 'fixed', this.iframe.style.zIndex = '999999', this.iframe.style.top = '0', this.iframe.style.left = '0', this.iframe.style.bottom = '0', this.iframe.style.right = '0', this.iframe.style.backgroundColor = 'transparent', this.iframe.src = this.getBaseUrl() + '/loader?_cb=' + a(new Date().getTime() / 1e3), this.iframe.onload = function () { console.log('loaded!') }, document.body.appendChild(this.iframe) }}, {key: 'getBaseUrl', value: function a () { switch (this.init.env) { case 'test':return 'https://verify.testwyre.com'; case 'staging':return 'https://verify-staging.i.sendwyre.com'; case 'local':return 'http://localhost:8890'; case 'local_https':return 'https://localhost:8890'; case 'production':default:return 'https://verify.sendwyre.com' } }}, {key: 'processClassicInit', value: function d (a) { if (a.auth) return a; var b = a, c = {env: b.env, auth: {type: 'metamask'}, operation: {type: 'onramp', destCurrency: b.destCurrency}, apiKey: b.apiKey}; return b.onExit && this.on('close', function (a) { a.error ? b.onExit(a.error) : b.onExit(null) }), b.onSuccess && this.on('complete', function () { b.onSuccess() }), console.debug('converted v1 config to v2, please use this instead: ', c), c }} ]), a }()), widget = Object.assign(Widget, {Widget: Widget})
  return Widget
}

function openWyre(address, atTimeOfOpen, onClose, onComplete) {
  const Wyre = createWyreWidget()
  const widget = new Wyre.Widget({
    env: 'test',
    accountId: 'AC_YGBPJGZCJ3Z',
    auth: { type: 'metamask' },
    operation: {
      type: 'debitcard',
      destCurrency: 'ETH',
      dest: `ethereum:${address}`,
    },
  })

  widget.open()

  atTimeOfOpen()

  widget.on('close', onClose)

  widget.on('complete', onComplete)
}

module.exports = openWyre
