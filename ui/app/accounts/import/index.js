const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
import Select from 'react-select'

module.exports = connect(mapStateToProps)(AccountImportSubview)

function mapStateToProps (state) {
  return {
    types: state.metamask.keyringTypes,
  }
}

inherits(AccountImportSubview, Component)
function AccountImportSubview () {
  Component.call(this)
}

AccountImportSubview.prototype.render = function () {
  const props = this.props
  const state = this.state || {}
  const { types } = props
  const { type } = state

  return (
    h('div', {
      style: {
      },
    }, [
      h('div', {
        style: {
          padding: '10px',
          background: 'rgb(242,242,242)',
          color: 'rgb(174, 174, 174)',
        },
      }, [
        h('h3', 'SELECT TYPE'),
      ]),

      h('style', `
        .has-value.Select--single > .Select-control .Select-value .Select-value-label, .Select-value-label {
          color: rgb(174,174,174);
        }
      `),

      h('div', {
        style: {
          padding: '10px',
        },
      }, [
        h(Select, {
          name: 'import-type-select',
          clearable: false,
          value: type || types[0],
          options: types.map((type) => {
            return {
              value: type,
              label: type,
            }
          }),
          onChange: (opt) => {
            this.setState({ type: opt.value })
          },
        })
      ])
    ])
  )
}

