const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const Identicon = require('./identicon')

module.exports = TransactionIcon

inherits(TransactionIcon, Component)
function TransactionIcon () {
  Component.call(this)
}

TransactionIcon.prototype.render = function () {
  const { transaction, txParams, isMsg } = this.props
  if (transaction.status === 'unapproved') {
    return h('.unapproved-tx', {
      style: {
        width: '15px',
        height: '15px',
        background: '#00bfff',
        borderRadius: '13px',
      },
    })

  } else if (transaction.status === 'rejected') {
    return h('i.fa.fa-exclamation-triangle.fa-lg.warning', {
      style: {
        width: '24px',
      },
    })
  } else if (transaction.status === 'signed') {
    return h('i.fa.fa-ellipsis-h', {
      style: {
        fontSize: '27px',
      },
    })
  } else if (transaction.status === 'failed') {
    return h('i.fa.fa-exclamation-triangle.fa-lg.warning', {
      style: {
        fontSize: '24px',
      },
    })
  }


  if (isMsg) {
    return h('i.fa.fa-certificate.fa-lg', {
      style: {
        width: '24px',
      },
    })
  }

  if (txParams.to) {
    return h(Identicon, {
      diameter: 24,
      address: txParams.to || transaction.hash,
    })
  } else {
    return h('i.fa.fa-file-text-o.fa-lg', {
      style: {
        width: '24px',
      },
    })
  }
}
