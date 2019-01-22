import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import actions from '../../../../ui/app/actions'
import Select from 'react-select'
import { importTypes } from './enums'
import { nestedJsonObjToArray } from './helpers'

// Subviews
import JsonImportView from './json.js'
import PrivateKeyImportView from './private-key.js'
import ContractImportView from './contract.js'

const menuItems = nestedJsonObjToArray(importTypes)

class AccountImportSubview extends Component {
  constructor (props) {
    super(props)
    this.state = {
      description: '',
      type: importTypes.PRIVATE_KEY,
    }
  }
  static propTypes = {
    menuItems: PropTypes.array,
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
                const type = opt.value
                let description
                switch (type) {
                  case importTypes.PRIVATE_KEY:
                  case importTypes.JSON_FILE:
                    description = ''
                    break
                  case importTypes.CONTRACT.DEFAULT:
                    description = `Contract type will automatically retrieve its ABI, if it was verified in <a href='https://blockscout.com' target='_blank'>Blockscout</a>`
                    break
                  case importTypes.CONTRACT.PROXY:
                    description = `Proxy contract type will automatically contain ABI of implementation, if proxy and implementation were both verified in <a href='https://blockscout.com' target='_blank'>Blockscout</a>`
                    break
                  default:
                    description = ''
                    break
                }
                this.setState({ type, description })
              },
            }}/>
            <p className="hw-connect__header__msg" dangerouslySetInnerHTML={{__html: this.state.description}} />
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
        return <ContractImportView type={importTypes.CONTRACT.DEFAULT}/>
      case importTypes.CONTRACT.PROXY:
        return <ContractImportView type={importTypes.CONTRACT.PROXY}/>
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
