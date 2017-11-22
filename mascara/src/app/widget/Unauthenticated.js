const { Component } = require('react')
const h = require('react-hyperscript')
const MediaQuery = require('react-responsive').default

class Unauthenticated extends Component {
  renderForLargeScreen () {
    return (
      h('div.unauthenticated__container.flex-row.align-center', [
        h('img.widget-logo--full', { src: 'images/logo.png' }),
        h('div.unauthenticated__right-section', [
          h('div.unauthenticated__header', 'MetaMask'),
          h('div.unauthenticated__subheader', 'Login or Sign up'),
        ]),
      ])
    )
  }

  renderForSmallScreen () {
    return (
      h('div.unauthenticated__container', [
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

module.exports = Unauthenticated
