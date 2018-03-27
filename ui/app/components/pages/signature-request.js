const { Component } = require('react')
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const Identicon = require('../identicon')
const { connect } = require('react-redux')
const ethUtil = require('ethereumjs-util')
const classnames = require('classnames')

const AccountDropdownMini = require('../dropdowns/account-dropdown-mini')

const t = require('../../i18n')
const { conversionUtil } = require('../../conversion-util')
const { DEFAULT_ROUTE } = require('../../routes')

const {
  getSelectedAccount,
  getCurrentAccountWithSendEtherInfo,
  getSelectedAddress,
  accountsWithSendEtherInfoSelector,
  conversionRateSelector,
} = require('../../selectors.js')

class SignatureRequest extends Component {
  constructor (props) {
    super(props)

    this.state = {
      selectedAccount: props.selectedAccount,
      accountDropdownOpen: false,
    }
  }

  componentWillMount () {
    const {
      unapprovedMsgCount = 0,
      unapprovedPersonalMsgCount = 0,
      unapprovedTypedMessagesCount = 0,
    } = this.props

    if (unapprovedMsgCount + unapprovedPersonalMsgCount + unapprovedTypedMessagesCount < 1) {
      this.props.history.push(DEFAULT_ROUTE)
    }
  }

  renderHeader () {
    return h('div.request-signature__header', [

      h('div.request-signature__header-background'),

      h('div.request-signature__header__text', t('sigRequest')),

      h('div.request-signature__header__tip-container', [
        h('div.request-signature__header__tip'),
      ]),

    ])
  }

  renderAccountDropdown () {
    const {
      selectedAccount,
      accountDropdownOpen,
    } = this.state

    const { accounts } = this.props

    return h('div.request-signature__account', [

      h('div.request-signature__account-text', [t('account') + ':']),

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

  renderBalance () {
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

  renderAccountInfo () {
    return h('div.request-signature__account-info', [

      this.renderAccountDropdown(),

      this.renderRequestIcon(),

      this.renderBalance(),

    ])
  }

  renderRequestIcon () {
    const { requesterAddress } = this.props

    return h('div.request-signature__request-icon', [
      h(Identicon, {
        diameter: 40,
        address: requesterAddress,
      }),
    ])
  }

  renderRequestInfo () {
    return h('div.request-signature__request-info', [

      h('div.request-signature__headline', [
        t('yourSigRequested'),
      ]),

    ])
  }

  msgHexToText (hex) {
    try {
      const stripped = ethUtil.stripHexPrefix(hex)
      const buff = Buffer.from(stripped, 'hex')
      return buff.toString('utf8')
    } catch (e) {
      return hex
    }
  }

  renderBody () {
    let rows
    let notice = t('youSign') + ':'

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

  renderFooter () {
    const {
      txData = {},
      signPersonalMessage,
      signTypedMessage,
      cancelPersonalMessage,
      cancelTypedMessage,
      signMessage,
      cancelMessage,
      history,
    } = this.props

    const { type } = txData

    let cancel = () => Promise.resolve()
    let sign = () => Promise.resolve()
    const { msgParams: params = {}, id } = txData
    params.id = id
    params.metamaskId = id

    switch (type) {
      case 'personal_sign':
        cancel = () => cancelPersonalMessage(params)
        sign = () => signPersonalMessage(params)
        break
      case 'eth_signTypedData':
        cancel = () => cancelTypedMessage(params)
        sign = () => signTypedMessage(params)
        break
      case 'eth_sign':
        cancel = () => cancelMessage(params)
        sign = () => signMessage(params)
        break
    }

    return h('div.request-signature__footer', [
      h('button.btn-secondary--lg.request-signature__footer__cancel-button', {
        onClick: () => {
          cancel().then(() => history.push(DEFAULT_ROUTE))
        },
      }, t('cancel')),
      h('button.btn-primary--lg', {
        onClick: () => {
          sign().then(() => history.push(DEFAULT_ROUTE))
        },
      }, t('sign')),
    ])
  }

  render () {
    return (
      h('div.request-signature__container', [

        this.renderHeader(),

        this.renderBody(),

        this.renderFooter(),

      ])
    )
  }
}

SignatureRequest.propTypes = {
  txData: PropTypes.object,
  signPersonalMessage: PropTypes.func,
  cancelPersonalMessage: PropTypes.func,
  signTypedMessage: PropTypes.func,
  cancelTypedMessage: PropTypes.func,
  signMessage: PropTypes.func,
  cancelMessage: PropTypes.func,
  requesterAddress: PropTypes.string,
  accounts: PropTypes.array,
  conversionRate: PropTypes.number,
  balance: PropTypes.string,
  selectedAccount: PropTypes.object,
  history: PropTypes.object,
  unapprovedMsgCount: PropTypes.number,
  unapprovedPersonalMsgCount: PropTypes.number,
  unapprovedTypedMessagesCount: PropTypes.number,
}

const mapStateToProps = state => {
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

module.exports = connect(mapStateToProps)(SignatureRequest)
