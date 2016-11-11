const injectCss = require('inject-css')
const MetaMaskUiCss = require('../../ui/css')
const startPopup = require('./popup-core')
const PortStream = require('./lib/port-stream.js')
const isPopupOrNotification = require('./lib/is-popup-or-notification')
const extension = require('./lib/extension')
const notification = require('./lib/notifications')

var css = MetaMaskUiCss()
injectCss(css)

var name = isPopupOrNotification()
closePopupIfOpen(name)
window.METAMASK_UI_TYPE = name

var pluginPort = extension.runtime.connect({ name })
var portStream = new PortStream(pluginPort)

startPopup(portStream)

function closePopupIfOpen (name) {
  if (name !== 'notification') {
    notification.closePopup()
  }
}
