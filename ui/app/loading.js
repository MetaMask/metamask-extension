const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('./actions')
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')

module.exports = connect(mapStateToProps)(LoadingIndicator)

function mapStateToProps(state) {
  return {
    isLoading: state.appState.isLoading,
  }
}

inherits(LoadingIndicator, Component)
function LoadingIndicator() {
  Component.call(this)
}

LoadingIndicator.prototype.render = function() {
  console.dir(this.props)
  var isLoading = this.props.isLoading

  return (
    h(ReactCSSTransitionGroup, {
      transitionName: "loader",
      transitionEnterTimeout: 150,
      transitionLeaveTimeout: 150,
    }, [

      isLoading ? h('div', {
        style: {
          position: 'absolute',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.5)',
        }
      }, [
        h('img', {
          src: 'images/loading.svg',
        }),
      ]) : null,

    ])
  )
}

