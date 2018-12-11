const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const connect = require('react-redux').connect

// Subviews
const ExternalAccountImportView = require('./external-account.js')


ExternalAccountForm.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect()(ExternalAccountForm)


inherits(ExternalAccountForm, Component)
function ExternalAccountForm () {
  Component.call(this)
}

ExternalAccountForm.prototype.render = function () {

  return (
    h('div.new-account-import-form', [

      h('.new-account-import-disclaimer', [
        h('span', this.context.t('externalAccountMsg')),
      ]),

      h('div.new-account-import-form__select-section', [

        h(ExternalAccountImportView),
      ]),
    ])
  )
}
