const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Tooltip = require('./tooltip')

const Identicon = require('./identicon')

module.exports = TransactionIcon

inherits(TransactionIcon, Component)
function TransactionIcon () {
  Component.call(this)
}

TransactionIcon.prototype.render = function () {
  const { transaction, txParams, isMsg } = this.props
  switch (transaction.status) {
    case 'unapproved':
      return h(!isMsg ? '.unapproved-tx-icon' : 'i.fa.fa-certificate.fa-lg')

    case 'rejected':
    case 'failed':
      return h('i.tx-warning')

    case 'submitted':
      return h(Tooltip, {
        title: 'Pending',
        position: 'right',
        id: 'transactionIcon',
      }, [
        h('i.new-tx', {
          style: {
            marginLeft: '10px',
          },
          'data-tip': '',
          'data-for': 'transactionIcon',
        }),
      ])
  }

  if (isMsg) {
    return h('i.fa.fa-certificate.fa-lg', {
      style: {
        width: '40px',
      },
    })
  }

  if (txParams.to) {
    return h(Identicon, {
      diameter: 40,
      address: txParams.to || transaction.hash,
    })
  } else {
    return h('i.contract-small', {
      style: {
        marginLeft: '11px',
      },
    })
  }
}
