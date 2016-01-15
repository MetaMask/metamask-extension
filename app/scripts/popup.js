const MetaMaskUi = require('metamask-ui')
const MetaMaskUiCss = require('metamask-ui/css')
const injectCss = require('inject-css')


var container = document.getElementById('app-content')

var css = MetaMaskUiCss()
injectCss(css)

var app = MetaMaskUi({
  container: container,
})
