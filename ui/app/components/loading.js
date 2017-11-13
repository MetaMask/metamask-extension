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
      h('.full-flex-height', {
        style: {
          position: 'absolute',
          left: '0px',
          zIndex: 19,
          flexDirection: 'column',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.8)',
        },
      }, [
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
