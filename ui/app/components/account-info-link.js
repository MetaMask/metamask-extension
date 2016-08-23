const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Tooltip = require('./tooltip')
const genAccountLink = require('../../lib/account-link')
const extension = require('../../../app/scripts/lib/extension')

module.exports = AccountInfoLink

inherits(AccountInfoLink, Component)
function AccountInfoLink () {
  Component.call(this)
}

AccountInfoLink.prototype.render = function () {
  const { selected, network } = this.props
  const title = 'View account on etherscan'
  const url = genAccountLink(selected, network)

  if (!url) {
    return null
  }

  return h('.account-info-link', {
    style: {
      display: 'flex',
      alignItems: 'center',
    },
  }, [

    h(Tooltip, {
      title,
    }, [
      h('i.fa.fa-info-circle.cursor-pointer.color-orange', {
        style: {
          margin: '5px',
        },
        onClick () { extension.tabs.create({ url }) },
      }),
    ]),
  ])
}
