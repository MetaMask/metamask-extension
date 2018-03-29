const inherits = require('util').inherits
const Component = require('react').Component
const Provider = require('react-redux').Provider
const h = require('react-hyperscript')
const SelectedApp = require('./select-app')
const I18nProvider = require('./i18n-provider')

module.exports = Root

inherits(Root, Component)
function Root () { Component.call(this) }

Root.prototype.render = function () {
  return (

    h(Provider, {
      store: this.props.store,
    }, [
      h(I18nProvider, [ h(SelectedApp) ]),
    ])

  )
}
