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
  const { to, identities, onChange } = this.props

  return h('div.send-v2__to-autocomplete', [

    h('input.send-v2__to-autocomplete__input', {
      name: 'address',
      list: 'addresses',
      placeholder: 'Recipient Address',
      value: to,
      onChange,
      // onBlur: () => {
      //   this.setErrorsFor('to')
      // },
      onFocus: event => {
        // this.clearErrorsFor('to')
        to && event.target.select()
      },
    }),

    h('datalist#addresses', [
      // Corresponds to the addresses owned.
      ...Object.entries(identities).map(([key, { address, name }]) => {
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

