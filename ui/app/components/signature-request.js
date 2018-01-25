const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('./identicon')
const connect = require('react-redux').connect
const ethUtil = require('ethereumjs-util')
const classnames = require('classnames')

const AccountDropdownMini = require('./dropdowns/account-dropdown-mini')

const actions = require('../actions')
const t = require('../../i18n')
const { conversionUtil } = require('../conversion-util')

const {
  getSelectedAccount,
  getCurrentAccountWithSendEtherInfo,
  getSelectedAddress,
  accountsWithSendEtherInfoSelector,
  conversionRateSelector,
} = require('../selectors.js')

function mapStateToProps (state) {
  return {
    balance: getSelectedAccount(state).balance,
    selectedAccount: getCurrentAccountWithSendEtherInfo(state),
    selectedAddress: getSelectedAddress(state),
    requester: null,
    requesterAddress: null,
    accounts: accountsWithSendEtherInfoSelector(state),
    conversionRate: conversionRateSelector(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    goHome: () => dispatch(actions.goHome()),
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(SignatureRequest)

inherits(SignatureRequest, Component)
function SignatureRequest (props) {
  Component.call(this)

  this.state = {
    selectedAccount: props.selectedAccount,
    accountDropdownOpen: false,
  }
}

SignatureRequest.prototype.renderHeader = function () {
  return h('div.request-signature__header', [

    h('div.request-signature__header-background'),

    h('div.request-signature__header__text', t('sigRequest')),

    h('div.request-signature__header__tip-container', [
      h('div.request-signature__header__tip'),
    ]),

  ])
}

SignatureRequest.prototype.renderAccountDropdown = function () {
  const {
    selectedAccount,
    accountDropdownOpen,
  } = this.state

  const {
    accounts,
  } = this.props

  return h('div.request-signature__account', [

    h('div.request-signature__account-text', [t('account')]),

    h(AccountDropdownMini, {
      selectedAccount,
      accounts,
      onSelect: selectedAccount => this.setState({ selectedAccount }),
      dropdownOpen: accountDropdownOpen,
      openDropdown: () => this.setState({ accountDropdownOpen: true }),
      closeDropdown: () => this.setState({ accountDropdownOpen: false }),
    }),

  ])
}

SignatureRequest.prototype.renderBalance = function () {
  const { balance, conversionRate } = this.props

  const balanceInEther = conversionUtil(balance, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
    conversionRate,
  })

  return h('div.request-signature__balance', [

    h('div.request-signature__balance-text', [t('balance')]),

    h('div.request-signature__balance-value', `${balanceInEther} ETH`),

  ])
}

SignatureRequest.prototype.renderAccountInfo = function () {
  return h('div.request-signature__account-info', [

    this.renderAccountDropdown(),

    this.renderRequestIcon(),

    this.renderBalance(),

  ])
}

SignatureRequest.prototype.renderRequestIcon = function () {
  const { requesterAddress } = this.props

  return h('div.request-signature__request-icon', [
    h(Identicon, {
      diameter: 40,
      address: requesterAddress,
    }),
  ])
}

SignatureRequest.prototype.renderRequestInfo = function () {
  return h('div.request-signature__request-info', [

    h('div.request-signature__headline', [
      t('yourSigRequested'),
    ]),

  ])
}

SignatureRequest.prototype.msgHexToText = function (hex) {
  try {
    const stripped = ethUtil.stripHexPrefix(hex)
    const buff = Buffer.from(stripped, 'hex')
    return buff.toString('utf8')
  } catch (e) {
    return hex
  }
}

SignatureRequest.prototype.renderBody = function () {
  let rows
  let notice = t('youSign')

  const { txData } = this.props
  const { type, msgParams: { data } } = txData

  if (type === 'personal_sign') {
    rows = [{ name: t('message'), value: this.msgHexToText(data) }]
  } else if (type === 'eth_signTypedData') {
    rows = data
  } else if (type === 'eth_sign') {
    rows = [{ name: t('message'), value: data }]
    notice = t('signNotice')
  }

  return h('div.request-signature__body', {}, [

    this.renderAccountInfo(),

    this.renderRequestInfo(),

    h('div.request-signature__notice', {
      className: classnames({
        'request-signature__notice': type === 'personal_sign' || type === 'eth_signTypedData',
        'request-signature__warning': type === 'eth_sign',
      }),
    }, [notice]),

    h('div.request-signature__rows', [

      ...rows.map(({ name, value }) => {
        return h('div.request-signature__row', [
          h('div.request-signature__row-title', [`${name}:`]),
          h('div.request-signature__row-value', value),
        ])
      }),

    ]),

  ])
}

SignatureRequest.prototype.renderFooter = function () {
  const {
    signPersonalMessage,
    signTypedMessage,
    cancelPersonalMessage,
    cancelTypedMessage,
    signMessage,
    cancelMessage,
  } = this.props

  const { txData } = this.props
  const { type } = txData

  let cancel
  let sign
  if (type === 'personal_sign') {
    cancel = cancelPersonalMessage
    sign = signPersonalMessage
  } else if (type === 'eth_signTypedData') {
    cancel = cancelTypedMessage
    sign = signTypedMessage
  } else if (type === 'eth_sign') {
    cancel = cancelMessage
    sign = signMessage
  }

  return h('div.request-signature__footer', [
    h('button.request-signature__footer__cancel-button', {
      onClick: cancel,
    }, t('cancelCaps')),
    h('button.request-signature__footer__sign-button', {
      onClick: sign,
    }, t('signCaps')),
  ])
}

SignatureRequest.prototype.render = function () {
  return (

    h('div.request-signature__container', [

      this.renderHeader(),

      this.renderBody(),

      this.renderFooter(),

    ])

  )

}
