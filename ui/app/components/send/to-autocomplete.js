const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('../identicon')

module.exports = ToAutoComplete

inherits(ToAutoComplete, Component)
function ToAutoComplete () {
  Component.call(this)
}

ToAutoComplete.prototype.render = function () {
  const { to, accounts, onChange, inError } = this.props

  return h('div.send-v2__to-autocomplete', [

    h('input.send-v2__to-autocomplete__input', {
      name: 'address',
      list: 'addresses',
      placeholder: 'Recipient Address',
      className: inError ? `send-v2__error-border` : '', 
      value: to,
      onChange,
      onFocus: event => {
        to && event.target.select()
      },
      style: {
        borderColor: inError ? 'red' : null,
      }
    }),

    h('datalist#addresses', [
      // Corresponds to the addresses owned.
      ...Object.entries(accounts).map(([key, { address, name }]) => {
        return h('option', {
          value: address,
          label: name,
          key: address,
        })
      }),
      // Corresponds to previously sent-to addresses.
      // ...addressBook.map(({ address, name }) => {
      //   return h('option', {
      //     value: address,
      //     label: name,
      //     key: address,
      //   })
      // }),
    ]),

  ])
    
}

