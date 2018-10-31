const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const connect = require('react-redux').connect
import Select from 'react-select'

// Subviews
const JsonImportView = require('./json.js')
const PrivateKeyImportView = require('./private-key.js')


AccountImportSubview.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect()(AccountImportSubview)


inherits(AccountImportSubview, Component)
function AccountImportSubview () {
  Component.call(this)
}

AccountImportSubview.prototype.getMenuItemTexts = function () {
  return [
    this.context.t('privateKey'),
    this.context.t('jsonFile'),
  ]
}

AccountImportSubview.prototype.render = function () {
  const state = this.state || {}
  const menuItems = this.getMenuItemTexts()
  const { type } = state

  return (
    h('div.new-account-import-form', [

      h('.new-account-import-disclaimer', [
        h('span', this.context.t('importAccountMsg')),
        h('span', {
          style: {
            cursor: 'pointer',
            textDecoration: 'underline',
          },
          onClick: () => {
            global.platform.openWindow({
              url: 'https://metamask.zendesk.com/hc/en-us/articles/360015289932',
            })
          },
        }, this.context.t('here')),
      ]),

      h('div.new-account-import-form__select-section', [

        h('div.new-account-import-form__select-label', this.context.t('selectType')),

        h(Select, {
          className: 'new-account-import-form__select',
          name: 'import-type-select',
          clearable: false,
          value: type || menuItems[0],
          options: menuItems.map((type) => {
            return {
              value: type,
              label: type,
            }
          }),
          onChange: (opt) => {
            this.setState({ type: opt.value })
          },
        }),

      ]),

      this.renderImportView(),
    ])
  )
}

AccountImportSubview.prototype.renderImportView = function () {
  const state = this.state || {}
  const { type } = state
  const menuItems = this.getMenuItemTexts()
  const current = type || menuItems[0]

  switch (current) {
    case this.context.t('privateKey'):
      return h(PrivateKeyImportView)
    case this.context.t('jsonFile'):
      return h(JsonImportView)
    default:
      return h(JsonImportView)
  }
}
