const { Component } = require('react')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const PropTypes = require('prop-types')
const Identicon = require('./identicon')

class SenderToRecipient extends Component {
  renderRecipientIcon () {
    const { recipientAddress } = this.props
    return (
      recipientAddress
        ? h(Identicon, { address: recipientAddress, diameter: 20 })
        : h('i.fa.fa-file-text-o')
    )
  }

  renderRecipient () {
    const { recipientName } = this.props
    return (
      h('.sender-to-recipient__recipient', [
        this.renderRecipientIcon(),
        h(
          '.sender-to-recipient__name.sender-to-recipient__recipient-name',
          recipientName || this.context.t('newContract')
        ),
      ])
    )
  }

  render () {
    const { senderName, senderAddress } = this.props

    return (
      h('.sender-to-recipient__container', [
        h('.sender-to-recipient__sender', [
          h('.sender-to-recipient__sender-icon', [
            h(Identicon, {
              address: senderAddress,
              diameter: 20,
            }),
          ]),
          h('.sender-to-recipient__name.sender-to-recipient__sender-name', senderName),
        ]),
        h('.sender-to-recipient__arrow-container', [
          h('.sender-to-recipient__arrow-circle', [
            h('img', {
              height: 15,
              width: 15,
              src: './images/arrow-right.svg',
            }),
          ]),
        ]),
        this.renderRecipient(),
      ])
    )
  }
}

SenderToRecipient.propTypes = {
  senderName: PropTypes.string,
  senderAddress: PropTypes.string,
  recipientName: PropTypes.string,
  recipientAddress: PropTypes.string,
  t: PropTypes.func,
}

SenderToRecipient.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect()(SenderToRecipient)

