const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('./actions')

module.exports = connect(mapStateToProps)(COMPONENTNAME)

function mapStateToProps(state) {
  return {}
}

inherits(COMPONENTNAME, Component)
function COMPONENTNAME() {
  Component.call(this)
}

COMPONENTNAME.prototype.render = function() {
  var state = this.props
  var rpc = state.rpc

  return (
    h('div', {
      style: {
        display: 'none',
      }
    }, [
    ])
  )
}

