import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Select from 'react-select'
import JsonImportView from './json'
import PrivateKeyImportView from './private-key'


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

  render () {
    const { type } = this.state
    const menuItems = this.getMenuItemTexts()

    return (
      <div className={'new-account-import-form'}>
        <div className={'new-account-import-disclaimer'}>
          <span>{this.context.t('importAccountMsg')}</span>
          <span
            style={{
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            onClick={() => {
              global.platform.openWindow({
                url: 'https://consensys.zendesk.com/hc/en-us/articles/360004180111-What-are-imported-accounts-New-UI',
              })
            }}
          >
            {this.context.t('here')}
          </span>
        </div>
        <div className={'new-account-import-form__select-section'}>
          <div className={'new-account-import-form__select-label'}>
            {this.context.t('selectType')}
          </div>
          <Select
            className={'new-account-import-form__select'}
            name={'import-type-select'}
            clearable={false}
            value={type || menuItems[0]}
            options={menuItems.map(type => ({
              value: type,
              label: type,
            }))}
            onChange={opt => {
              this.setState({ type: opt.value })
            }}
          />
        </div>
        {this.renderImportView()}
      </div>
    )
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

}
