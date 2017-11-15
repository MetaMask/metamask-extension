const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../actions')
import Select from 'react-select'

// Subviews
const JsonImportView = require('./json.js')
const PrivateKeyImportView = require('./private-key.js')

const menuItems = [
  'Private Key',
  'JSON File',
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
    h('div.flex-center', {
      style: {
        flexDirection: 'column',
        marginTop: '32px',
      },
    }, [
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: (event) => {
            props.dispatch(actions.goHome())
          },
        }),
        h('h2.page-subtitle', 'Import Accounts'),
      ]),
      h('div', {
        style: {
          padding: '10px 0',
          width: '260px',
          color: 'rgb(174, 174, 174)',
        },
      }, [

        h('h3', { style: { padding: '3px' } }, 'SELECT TYPE'),

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
    ])
  )
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
    default:
      return h(JsonImportView)
  }
}
