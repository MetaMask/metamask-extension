<<<<<<< HEAD
const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const connect = require('react-redux').connect
=======
import React, { Component } from 'react'
import PropTypes from 'prop-types'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
import Select from 'react-select'

// Subviews
import JsonImportView from './json.js'

import PrivateKeyImportView from './private-key.js'

export default class AccountImportSubview extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  state = {}

  getMenuItemTexts () {
    return [
      this.context.t('privateKey'),
      this.context.t('jsonFile'),
    ]
  }

  renderImportView () {
    const { type } = this.state
    const menuItems = this.getMenuItemTexts()
    const current = type || menuItems[0]

    switch (current) {
      case this.context.t('privateKey'):
        return <PrivateKeyImportView />
      case this.context.t('jsonFile'):
        return <JsonImportView />
      default:
        return <JsonImportView />
    }
  }

  render () {
    const menuItems = this.getMenuItemTexts()
    const { type } = this.state

<<<<<<< HEAD
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
=======
    return (
      <div className="new-account-import-form">
        <div className="new-account-import-disclaimer">
          <span>{this.context.t('importAccountMsg')}</span>
          <span
            style={{
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            onClick={() => {
              global.platform.openWindow({
                url: 'https://metamask.zendesk.com/hc/en-us/articles/360015289932',
              })
            }}
          >
            {this.context.t('here')}
          </span>
        </div>
        <div className="new-account-import-form__select-section">
          <div className="new-account-import-form__select-label">
            {this.context.t('selectType')}
          </div>
          <Select
            className="new-account-import-form__select"
            name="import-type-select"
            clearable={false}
            value={type || menuItems[0]}
            options={menuItems.map((type) => {
              return {
                value: type,
                label: type,
              }
            })}
            onChange={(opt) => {
              this.setState({ type: opt.value })
            }}
          />
        </div>
        {this.renderImportView()}
      </div>
    )
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
  }
}
