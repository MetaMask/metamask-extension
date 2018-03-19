const { Component } = require('react')
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const t = require('../../i18n-helper').getMessage
const Identicon = require('./identicon')

class SenderToRecipient extends Component {
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
              src: '/images/arrow-right.svg',
            }),
          ]),
        ]),
        h('.sender-to-recipient__recipient', [
          h('i.fa.fa-file-text-o'),
          h('.sender-to-recipient__name.sender-to-recipient__recipient-name', t(this.props.localeMessages, 'newContract')),
        ]),
      ])
    )
  }
}

SenderToRecipient.propTypes = {
  senderName: PropTypes.string,
  senderAddress: PropTypes.string,
}

module.exports = SenderToRecipient
