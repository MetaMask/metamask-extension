const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import Identicon from '../ui/identicon'
const connect = require('react-redux').connect
const ethUtil = require('ethereumjs-util')
const classnames = require('classnames')
const { compose } = require('recompose')
const { withRouter } = require('react-router-dom')
const { ObjectInspector } = require('react-inspector')

import AccountListItem from '../../pages/send/account-list-item/account-list-item.component'

const actions = require('../../store/actions')
const { conversionUtil } = require('../../helpers/utils/conversion-util')

const {
  getSelectedAccount,
  getCurrentAccountWithSendEtherInfo,
  getSelectedAddress,
  conversionRateSelector,
} = require('../../selectors/selectors.js')

import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck'
import Button from '../ui/button'

const { DEFAULT_ROUTE } = require('../../helpers/constants/routes')

function mapStateToProps (state) {
  return {
    balance: getSelectedAccount(state).balance,
    selectedAccount: getCurrentAccountWithSendEtherInfo(state),
    selectedAddress: getSelectedAddress(state),
    requester: null,
    requesterAddress: null,
    conversionRate: conversionRateSelector(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    goHome: () => dispatch(actions.goHome()),
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const {
    signPersonalMessage,
    signTypedMessage,
    cancelPersonalMessage,
    cancelTypedMessage,
    signMessage,
    cancelMessage,
    txData,
  } = ownProps

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

  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    txData,
    cancel,
    sign,
  }
}

SignatureRequest.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps)
)(SignatureRequest)


inherits(SignatureRequest, Component)
function SignatureRequest (props) {
  Component.call(this)

  this.state = {
    selectedAccount: props.selectedAccount,
  }
}

SignatureRequest.prototype.componentDidMount = function () {
  const { clearConfirmTransaction, cancel } = this.props
  const { metricsEvent } = this.context
  if (getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_NOTIFICATION) {
    window.onbeforeunload = event => {
      metricsEvent({
        eventOpts: {
          category: 'Transactions',
          action: 'Sign Request',
          name: 'Cancel Sig Request Via Notification Close',
        },
      })
      clearConfirmTransaction()
      cancel(event)
    }
  }
}

SignatureRequest.prototype.renderHeader = function () {
  return h('div.request-signature__header', [

    h('div.request-signature__header-background'),

    h('div.request-signature__header__text', this.context.t('sigRequest')),

    h('div.request-signature__header__tip-container', [
      h('div.request-signature__header__tip'),
    ]),

  ])
}

SignatureRequest.prototype.renderAccount = function () {
  const { selectedAccount } = this.state

  return h('div.request-signature__account', [

    h('div.request-signature__account-text', [this.context.t('account') + ':']),

    h('div.request-signature__account-item', [
      h(AccountListItem, {
        account: selectedAccount,
        displayBalance: false,
      }),
    ]),
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

    h('div.request-signature__balance-text', `${this.context.t('balance')}:`),

    h('div.request-signature__balance-value', `${balanceInEther} ETH`),

  ])
}

SignatureRequest.prototype.renderAccountInfo = function () {
  return h('div.request-signature__account-info', [

    this.renderAccount(),

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
      this.context.t('yourSigRequested'),
    ]),

  ])
}

SignatureRequest.prototype.msgHexToText = function (hex) {
  try {
    const stripped = ethUtil.stripHexPrefix(hex)
    const buff = Buffer.from(stripped, 'hex')
    return buff.length === 32 ? hex : buff.toString('utf8')
  } catch (e) {
    return hex
  }
}

// eslint-disable-next-line react/display-name
SignatureRequest.prototype.renderTypedData = function (data) {
  const { domain, message } = JSON.parse(data)
  return [
    h('div.request-signature__typed-container', [
      domain ? h('div', [
        h('h1', 'Domain'),
        h(ObjectInspector, { data: domain, expandLevel: 1, name: 'domain' }),
      ]) : '',
      message ? h('div', [
        h('h1', 'Message'),
        h(ObjectInspector, { data: message, expandLevel: 1, name: 'message' }),
      ]) : '',
    ]),
  ]
}

SignatureRequest.prototype.renderBody = function () {
  let rows
  let notice = this.context.t('youSign') + ':'

  const { txData } = this.props
  const { type, msgParams: { data, version } } = txData

  if (type === 'personal_sign') {
    rows = [{ name: this.context.t('message'), value: this.msgHexToText(data) }]
  } else if (type === 'eth_signTypedData') {
    rows = data
  } else if (type === 'eth_sign') {
    rows = [{ name: this.context.t('message'), value: data }]
    notice = [this.context.t('signNotice'),
      h('span.request-signature__help-link', {
        onClick: () => {
          global.platform.openWindow({
            url: 'https://metamask.zendesk.com/hc/en-us/articles/360015488751',
          })
        },
      }, this.context.t('learnMore'))]
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

    h('div.request-signature__rows',
      type === 'eth_signTypedData' && (version === 'V3' || version === 'V4') ?
        this.renderTypedData(data) :
        rows.map(({ name, value }) => {
          if (typeof value === 'boolean') {
            value = value.toString()
          }
          return h('div.request-signature__row', [
            h('div.request-signature__row-title', [`${name}:`]),
            h('div.request-signature__row-value', value),
          ])
        }),
    ),
  ])
}

SignatureRequest.prototype.renderFooter = function () {
  const { cancel, sign } = this.props

  return h('div.request-signature__footer', [
    h(Button, {
      type: 'default',
      large: true,
      className: 'request-signature__footer__cancel-button',
      onClick: event => {
        cancel(event).then(() => {
          this.context.metricsEvent({
            eventOpts: {
              category: 'Transactions',
              action: 'Sign Request',
              name: 'Cancel',
            },
          })
          this.props.clearConfirmTransaction()
          this.props.history.push(DEFAULT_ROUTE)
        })
      },
    }, this.context.t('cancel')),
    h(Button, {
      type: 'secondary',
      large: true,
      className: 'request-signature__footer__sign-button',
      onClick: event => {
        sign(event).then(() => {
          this.context.metricsEvent({
            eventOpts: {
              category: 'Transactions',
              action: 'Sign Request',
              name: 'Confirm',
            },
          })
          this.props.clearConfirmTransaction()
          this.props.history.push(DEFAULT_ROUTE)
        })
      },
    }, this.context.t('sign')),
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
