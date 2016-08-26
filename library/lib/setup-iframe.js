const Iframe = require('iframe')
const IframeStream = require('iframe-stream').IframeStream

module.exports = setupIframe


function setupIframe(opts) {
  opts = opts || {}
  var frame = Iframe({
    src: opts.zeroClientProvider || 'https://zero.metamask.io/',
    container: document.head,
    sandboxAttributes: opts.sandboxAttributes || ['allow-scripts', 'allow-popups'],
  })
  var iframe = frame.iframe
  var iframeStream = new IframeStream(iframe)

  return iframeStream
}
