const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const hyperClassnames = require('../../lib/hyper-classnames')
const prefixForNetwork = require('../../lib/etherscan-prefix-for-network')
const Identicon = require('./identicon')

module.exports = TxListItem

inherits(TxListItem, Component)
function TxListItem () {
  Component.call(this)
}

TxListItem.prototype.getAddressText = function (address) {
  return address
    ? `${address.slice(0, 10)}...${address.slice(-4)}`
    : 'Contract Published'
}

TxListItem.prototype.render = function () {
  const {
    transactionStatus,
    onClick,
    transActionId,
    dateString,
    address,
    transactionAmount,
    className,
  } = this.props

  const txStatusClassNames = hyperClassnames('span.tx-list-status', {
    '.tx-list-status--rejected': transactionStatus === 'rejected'
  })
  const txAmountClassNames = hyperClassnames('span.tx-list-value', {
    '.tx-list-value--confirmed': transactionStatus === 'confirmed'
  })

  return h(`div${className || ''}`, {
    key: transActionId,
    onClick: () => onClick && onClick(transActionId),
  }, [
    h(`div.flex-column.tx-list-item-wrapper`, {}, [

      h('div.tx-list-date-wrapper', {
        style: {},
      }, [
        h('span.tx-list-date', {}, [
          dateString,
        ]),
      ]),

      h('div.flex-row.tx-list-content-wrapper', {
        style: {},
      }, [

        h('div.tx-list-identicon-wrapper', {
          style: {},
        }, [
          h(Identicon, {
            address,
            diameter: 28,
          }),
        ]),

        h('div.tx-list-account-and-status-wrapper', {}, [
          h('div.tx-list-account-wrapper', {
            style: {},
          }, [
            h('span.tx-list-account', {}, [
              this.getAddressText(address),
            ]),
          ]),

          h('div.tx-list-status-wrapper', {
            style: {},
          }, [
            h(txStatusClassNames, {}, [
              transactionStatus,
            ]),
          ]),
        ]),

        h('div.flex-column.tx-list-details-wrapper', {
          style: {},
        }, [

          h(txAmountClassNames, {}, [
            transactionAmount,
          ]),

          h('span.tx-list-fiat-value', {}, [
            '+ $300 USD',
          ]),

        ]),
      ]),
    ]) // holding on icon from design
  ])
}
