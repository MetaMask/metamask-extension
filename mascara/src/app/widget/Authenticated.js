const { Component } = require('react')
const h = require('react-hyperscript')
const MediaQuery = require('react-responsive').default

class Authenticated extends Component {
  renderForLargeScreen () {
    return (
      h('div.authenticated__container', [
        h('div.authenticated__header', [
          h('div.flex-row.align-center', [
            h('img.widget-logo--mini', { src: 'images/logo.png' }),
            h('div.authenticated__header--metamask', 'MetaMask'),
            h('div.authenticated__header--subheader', 'Logged in'),
          ]),
          h('div.authenticated__network-icon'),
        ]),
        h('div.authenticated__content.flex-row.align-center', [
          h('div.authenticated__account-icon'),
          h('div.authenticated__account-name', 'Account'),
        ]),
      ])
    )
  }

  renderForSmallScreen () {
    return (
      h('div.authenticated__container', [
        h('img.widget-logo--full', { src: 'images/logo.png' }),
      ])
    )
  }

  render () {
    return (
      h('div', [
        h(MediaQuery, { minDeviceWidth: 576 }, this.renderForLargeScreen()),
        h(MediaQuery, { maxDeviceWidth: 575 }, this.renderForSmallScreen()),
      ])
    )
  }
}

module.exports = Authenticated
