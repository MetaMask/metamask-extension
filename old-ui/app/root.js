const inherits = require('util').inherits
const Component = require('react').Component
const Provider = require('react-redux').Provider
const h = require('react-hyperscript')
const App = require('./app')

module.exports = Root

inherits(Root, Component)
function Root () { Component.call(this) }

Root.prototype.render = function () {
	console.log(123454)
  return (

    h(Provider, {
      store: this.props.store,
    }, [
      h(App),
    ])

  )
}
