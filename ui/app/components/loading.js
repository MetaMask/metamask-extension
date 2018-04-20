const { Component } = require('react')
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const classnames = require('classnames')

class LoadingIndicator extends Component {
  renderMessage () {
    const { loadingMessage } = this.props
    return loadingMessage && h('span', loadingMessage)
  }

  render () {
    return (
      h('.loading-overlay', {
        className: classnames({ 'loading-overlay--full-screen': this.props.fullScreen }),
      }, [
        h('.flex-center.flex-column', [
          h('img', {
            src: 'images/loading.svg',
          }),

          this.renderMessage(),
        ]),
      ])
    )
  }
}

LoadingIndicator.propTypes = {
  loadingMessage: PropTypes.string,
  fullScreen: PropTypes.bool,
}

module.exports = LoadingIndicator
