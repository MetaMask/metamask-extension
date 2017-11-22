const { Component } = require('react')
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const Unauthenticated = require('./Unauthenticated')
const Authenticated = require('./Authenticated')

class App extends Component {
  render () {
    const { selectedAddress } = this.props

    return (
      h('div.app', [
        selectedAddress ? h(Authenticated) : h(Unauthenticated),
      ])
    )
  }
}

App.propTypes = {
  selectedAddress: PropTypes.string,
}

module.exports = App
