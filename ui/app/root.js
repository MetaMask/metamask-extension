const inherits = require('util').inherits
const React = require('react')
const Component = require('react').Component
const Provider = require('react-redux').Provider
const h = require('react-hyperscript')
const App = require('./app')

module.exports = Root

inherits(Root, Component)
function Root () { Component.call(this) }

Root.prototype.render = function () {
  return (

    h(Provider, {
      store: this.props.store,
    }, [
      h(App),
    ])

  )
}
