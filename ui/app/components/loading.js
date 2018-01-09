const { Component } = require('react')
const h = require('react-hyperscript')
const PropTypes = require('react').PropTypes

class LoadingIndicator extends Component {
  renderMessage () {
    const { loadingMessage } = this.props
    return loadingMessage && h('span', loadingMessage)
  }

  render () {
    return (
      h('.full-flex-height.loading-overlay', {}, [
        h('img', {
          src: 'images/loading.svg',
        }),

        h('br'),

        this.renderMessage(),
      ])
    )
  }
}

LoadingIndicator.propTypes = {
  loadingMessage: PropTypes.string,
}

module.exports = LoadingIndicator
