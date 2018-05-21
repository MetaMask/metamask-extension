const { Component } = require('react')
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const classnames = require('classnames')
const Spinner = require('../spinner')

class LoadingScreen extends Component {
  renderMessage () {
    const { loadingMessage } = this.props
    return loadingMessage && h('span', loadingMessage)
  }

  render () {
    return (
      h('.loading-overlay', {
        className: classnames({ 'loading-overlay--full-screen': this.props.fullScreen }),
      }, [
        h('.loading-overlay__container', [
          h(Spinner, {
            color: '#0168E5',
          }),

          this.renderMessage(),
        ]),
      ])
    )
  }
}

LoadingScreen.propTypes = {
  loadingMessage: PropTypes.string,
  fullScreen: PropTypes.bool,
}

module.exports = LoadingScreen
