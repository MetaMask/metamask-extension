const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect

module.exports = connect(mapStateToProps)(NewKeychain)

function mapStateToProps (state) {
  return {}
}

inherits(NewKeychain, Component)
function NewKeychain () {
  Component.call(this)
}

NewKeychain.prototype.render = function () {
  // const props = this.props

  return (
    h('div', {
      style: {
        background: 'blue',
      },
    }, [
      h('h1', `Here's a list!!!!`),
    ])
  )
}
