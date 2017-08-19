const Iframe = require('iframe')
const IframeStream = require('iframe-stream').IframeStream

module.exports = setupIframe


function setupIframe(opts) {
  opts = opts || {}
  var frame = Iframe({
    src: opts.zeroClientProvider || 'https://zero.metamask.io/',
    container: opts.container || document.head,
    sandboxAttributes: opts.sandboxAttributes || ['allow-scripts', 'allow-popups'],
  })
  var iframe = frame.iframe
  iframe.style.setProperty('display', 'none')
  var iframeStream = IframeStream(iframe)

  return iframeStream
}
