const { Component } = require('react')
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const Spinner = require('../spinner')

class LoadingScreen extends Component {
  renderMessage () {
    const { loadingMessage } = this.props
    return loadingMessage && h('span', loadingMessage)
  }

  render () {
    return (
      h('.loading-overlay', [
        h('.loading-overlay__container', [
          h(Spinner, {
            color: '#F7C06C',
          }),

          this.renderMessage(),
        ]),
      ])
    )
  }
}

LoadingScreen.propTypes = {
  loadingMessage: PropTypes.string,
}

module.exports = LoadingScreen
