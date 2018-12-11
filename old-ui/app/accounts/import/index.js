const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../../ui/app/actions')
import Select from 'react-select'

// Subviews
const JsonImportView = require('./json.js')
const PrivateKeyImportView = require('./private-key.js')
const ContractImportView = require('./contract.js')

const menuItems = [
  'Private Key',
  'JSON File',
  'Contract',
]

module.exports = connect(mapStateToProps)(AccountImportSubview)

function mapStateToProps (state) {
  return {
    menuItems,
  }
}

inherits(AccountImportSubview, Component)
function AccountImportSubview () {
  Component.call(this)
}

AccountImportSubview.prototype.render = function () {
  const props = this.props
  const state = this.state || {}
  const { menuItems } = props
  const { type } = state

  return (
    h('div', {
      style: {
        width: '100%',
      },
    }, [
      h('.section-title', { style: {
        height: '1px',
        width: '100%',
      }}),
      h('div', {
        style: {
          width: '100%',
          paddingLeft: '30px',
          paddingRight: '30px',
        },
      }, [
        h('.flex-row.flex-center', [
          h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
            onClick: (event) => {
              props.dispatch(actions.goHome())
            },
            style: {
              position: 'absolute',
              left: '30px',
            },
          }),
          h('h2.page-subtitle', {
            style: {
              fontFamily: 'Nunito SemiBold',
            },
          }, 'Import Accounts'),
        ]),
        h('.error', {
          style: {
            display: 'inline-block',
            alignItems: 'center',
          },
        }, [
          h('span', 'Imported accounts will not be associated with your originally created Nifty Wallet account seedphrase.'),
        ]),
        h('div', {
          style: {
            padding: '10px 0',
          },
        }, [

          h('h3', { style: { padding: '3px' } }, 'Select Type'),

          h('style', `
            .has-value.Select--single > .Select-control .Select-value .Select-value-label, .Select-value-label {
              color: rgb(174,174,174);
            }
          `),

          h(Select, {
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
              props.dispatch(actions.showImportPage())
              this.setState({ type: opt.value })
            },
          }),
        ]),

        this.renderImportView(),
      ]),
    ])
  )
}

AccountImportSubview.prototype.componentWillUnmount = function () {
  this.props.dispatch(actions.displayWarning(''))
}

AccountImportSubview.prototype.renderImportView = function () {
  const props = this.props
  const state = this.state || {}
  const { type } = state
  const { menuItems } = props
  const current = type || menuItems[0]

  switch (current) {
    case 'Private Key':
      return h(PrivateKeyImportView)
    case 'JSON File':
      return h(JsonImportView)
    case 'Contract':
      return h(ContractImportView)
    default:
      return h(JsonImportView)
  }
}
