import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import actions from '../../../../ui/app/actions'
import Select from 'react-select'
import { importTypes } from './enums'
import { nestedJsonObjToArray } from './helpers'

// Subviews
const JsonImportView = require('./json.js')
const PrivateKeyImportView = require('./private-key.js')
const ContractImportView = require('./contract.js')

const menuItems = nestedJsonObjToArray(importTypes)

class AccountImportSubview extends Component {
  static propTypes = {
    menuItems: PropTypes.object.Array,
    warning: PropTypes.node,
    goHome: PropTypes.func,
    displayWarning: PropTypes.func,
    showImportPage: PropTypes.func,
  }
  render () {
    const props = this.props
    const state = this.state || {}
    const { menuItems } = props
    const { type } = state

    return (
      <div style={{
        width: '100%',
      }}>
        <div className="section-title" style={{
          height: '1px',
          width: '100%',
        }} />
        <div style={{
          width: '100%',
          padding: '0 30px',
        }}>
          <div className="flex-row flex-center">
            <div
              className="i fa fa-arrow-left fa-lg cursor-pointer"
              onClick={(event) => { props.goHome() }}
              style={{
                position: 'absolute',
                left: '30px',
              }}
            />
            <h2 className="page-subtitle" style={{
              fontFamily: 'Nunito SemiBold',
            }}
            >Import Accounts</h2>
          </div>
          <div
            className="error"
            style={{
              display: 'inline-block',
              alignItems: 'center',
          }}>
            <span>Imported accounts will not be associated with your originally created Nifty Wallet account seedphrase.</span>
          </div>
          <div style={{ padding: '10px 0' }}>
            <h3 style={{ padding: '3px' }}>Select Type</h3>
            <Select {...{
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
                props.showImportPage()
                this.setState({ type: opt.value })
              },
            }}/>
          </div>
          {this.renderImportView()}
        </div>
      </div>
    )
  }

  componentWillUnmount () {
    this.props.displayWarning('')
  }
  renderImportView () {
    const { menuItems } = this.props
    const state = this.state || {}
    const { type } = state
    const current = type || menuItems[0]

    switch (current) {
      case importTypes.PRIVATE_KEY:
        return <PrivateKeyImportView/>
      case importTypes.JSON_FILE:
        return <JsonImportView/>
      case importTypes.CONTRACT.DEFAULT:
        return <ContractImportView/>
      case importTypes.CONTRACT.PROXY:
        return <ContractImportView/>
      default:
        return <JsonImportView/>
    }
  }
}

const mapStateToProps = (state) => {
  return {
    menuItems,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    goHome: () => dispatch(actions.goHome()),
    displayWarning: warning => dispatch(actions.displayWarning(warning)),
    showImportPage: options => dispatch(actions.showImportPage()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(AccountImportSubview)
