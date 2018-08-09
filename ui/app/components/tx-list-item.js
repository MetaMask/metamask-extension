const Component = require('react').Component
const PropTypes = require('prop-types')
const { compose } = require('recompose')
const { withRouter } = require('react-router-dom')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const inherits = require('util').inherits
const classnames = require('classnames')
const abi = require('human-standard-token-abi')
const abiDecoder = require('abi-decoder')
abiDecoder.addABI(abi)
const Identicon = require('./identicon')
const contractMap = require('eth-contract-metadata')
const { checksumAddress } = require('../util')

const actions = require('../actions')
const { conversionUtil, multiplyCurrencies } = require('../conversion-util')
const { calcTokenAmount } = require('../token-util')

const { getCurrentCurrency } = require('../selectors')
const { CONFIRM_TRANSACTION_ROUTE } = require('../routes')

TxListItem.contextTypes = {
  t: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(TxListItem)

function mapStateToProps (state) {
  return {
    tokens: state.metamask.tokens,
    currentCurrency: getCurrentCurrency(state),
    contractExchangeRates: state.metamask.contractExchangeRates,
    selectedAddressTxList: state.metamask.selectedAddressTxList,
    networkNonce: state.appState.networkNonce,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setSelectedToken: tokenAddress => dispatch(actions.setSelectedToken(tokenAddress)),
    retryTransaction: transactionId => dispatch(actions.retryTransaction(transactionId)),
  }
}

inherits(TxListItem, Component)
function TxListItem () {
  Component.call(this)

  this.state = {
    total: null,
    fiatTotal: null,
    isTokenTx: null,
  }

  this.unmounted = false
}

TxListItem.prototype.componentDidMount = async function () {
  const { txParams = {} } = this.props

  const decodedData = txParams.data && abiDecoder.decodeMethod(txParams.data)
  const { name: txDataName } = decodedData || {}
  const isTokenTx = txDataName === 'transfer'

  const { total, fiatTotal } = isTokenTx
    ? await this.getSendTokenTotal()
    : this.getSendEtherTotal()

  if (this.unmounted) {
    return
  }
  this.setState({ total, fiatTotal, isTokenTx })
}

TxListItem.prototype.componentWillUnmount = function () {
  this.unmounted = true
}

TxListItem.prototype.getAddressText = function () {
  const {
    address,
    txParams = {},
    isMsg,
  } = this.props

  const decodedData = txParams.data && abiDecoder.decodeMethod(txParams.data)
  const { name: txDataName, params = [] } = decodedData || {}
  const { value } = params[0] || {}
  const checksummedAddress = checksumAddress(address)
  const checksummedValue = checksumAddress(value)

  let addressText
  if (txDataName === 'transfer' || address) {
    const addressToRender = txDataName === 'transfer' ? checksummedValue : checksummedAddress
    addressText = `${addressToRender.slice(0, 10)}...${addressToRender.slice(-4)}`
  } else if (isMsg) {
    addressText = this.context.t('sigRequest')
  } else {
    addressText = this.context.t('contractDeployment')
  }

  return addressText
}

TxListItem.prototype.getSendEtherTotal = function () {
  const {
    transactionAmount,
    conversionRate,
    address,
    currentCurrency,
  } = this.props

  if (!address) {
    return {}
  }

  const totalInFiat = conversionUtil(transactionAmount, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency: 'ETH',
    toCurrency: currentCurrency,
    fromDenomination: 'WEI',
    numberOfDecimals: 2,
    conversionRate,
  })
  const totalInETH = conversionUtil(transactionAmount, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency: 'ETH',
    toCurrency: 'ETH',
    fromDenomination: 'WEI',
    conversionRate,
    numberOfDecimals: 6,
  })

  return {
    total: `${totalInETH} ETH`,
    fiatTotal: `${totalInFiat} ${currentCurrency.toUpperCase()}`,
  }
}

TxListItem.prototype.getTokenInfo = async function () {
  const { txParams = {}, tokenInfoGetter, tokens } = this.props
  const toAddress = txParams.to

  let decimals
  let symbol

  ({ decimals, symbol } = tokens.filter(({ address }) => address === toAddress)[0] || {})

  if (!decimals && !symbol) {
    ({ decimals, symbol } = contractMap[toAddress] || {})
  }

  if (!decimals && !symbol) {
    ({ decimals, symbol } = await tokenInfoGetter(toAddress))
  }

  return { decimals, symbol, address: toAddress }
}

TxListItem.prototype.getSendTokenTotal = async function () {
  const {
    txParams = {},
    conversionRate,
    contractExchangeRates,
    currentCurrency,
  } = this.props

  const decodedData = txParams.data && abiDecoder.decodeMethod(txParams.data)
  const { params = [] } = decodedData || {}
  const { value } = params[1] || {}
  const { decimals, symbol, address } = await this.getTokenInfo()
  const total = calcTokenAmount(value, decimals)

  let tokenToFiatRate
  let totalInFiat

  if (contractExchangeRates[address]) {
    tokenToFiatRate = multiplyCurrencies(
      contractExchangeRates[address],
      conversionRate
    )

    totalInFiat = conversionUtil(total, {
      fromNumericBase: 'dec',
      toNumericBase: 'dec',
      fromCurrency: symbol,
      toCurrency: currentCurrency,
      numberOfDecimals: 2,
      conversionRate: tokenToFiatRate,
    })
  }

  const showFiat = Boolean(totalInFiat) && currentCurrency.toUpperCase() !== symbol

  return {
    total: `${total} ${symbol}`,
    fiatTotal: showFiat && `${totalInFiat} ${currentCurrency.toUpperCase()}`,
  }
}

TxListItem.prototype.showRetryButton = function () {
  const {
    transactionSubmittedTime,
    selectedAddressTxList,
    transactionId,
    txParams,
    networkNonce,
  } = this.props
  if (!txParams) {
    return false
  }
  let currentTxSharesEarliestNonce = false
  const currentNonce = txParams.nonce
  const currentNonceTxs = selectedAddressTxList.filter(tx => tx.txParams.nonce === currentNonce)
  const currentNonceSubmittedTxs = currentNonceTxs.filter(tx => tx.status === 'submitted')
  const currentSubmittedTxs = selectedAddressTxList.filter(tx => tx.status === 'submitted')
  const lastSubmittedTxWithCurrentNonce = currentNonceSubmittedTxs[currentNonceSubmittedTxs.length - 1]
  const currentTxIsLatestWithNonce = lastSubmittedTxWithCurrentNonce &&
    lastSubmittedTxWithCurrentNonce.id === transactionId
  if (currentSubmittedTxs.length > 0) {
    currentTxSharesEarliestNonce = currentNonce === networkNonce
  }

  return currentTxSharesEarliestNonce && currentTxIsLatestWithNonce && Date.now() - transactionSubmittedTime > 30000
}

TxListItem.prototype.setSelectedToken = function (tokenAddress) {
  this.props.setSelectedToken(tokenAddress)
}

TxListItem.prototype.resubmit = function () {
  const { transactionId } = this.props
  this.props.retryTransaction(transactionId)
    .then(id => this.props.history.push(`${CONFIRM_TRANSACTION_ROUTE}/${id}`))
}

TxListItem.prototype.render = function () {
  const {
    transactionStatus,
    onClick,
    transactionId,
    dateString,
    address,
    className,
    txParams,
  } = this.props
  const { total, fiatTotal, isTokenTx } = this.state

  return h(`div${className || ''}`, {
    key: transactionId,
    onClick: () => onClick && onClick(transactionId),
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
            h('span', {
              className: classnames('tx-list-status', {
                'tx-list-status--rejected': transactionStatus === 'rejected',
                'tx-list-status--failed': transactionStatus === 'failed',
                'tx-list-status--dropped': transactionStatus === 'dropped',
              }),
            },
              this.txStatusIndicator(),
            ),
          ]),
        ]),

        h('div.flex-column.tx-list-details-wrapper', {
          style: {},
        }, [

          h('span.tx-list-value', total),

          fiatTotal && h('span.tx-list-fiat-value', fiatTotal),

        ]),
      ]),

      this.showRetryButton() && h('.tx-list-item-retry-container', {
        onClick: (event) => {
          event.stopPropagation()
          if (isTokenTx) {
            this.setSelectedToken(txParams.to)
          }
          this.resubmit()
        },
      }, [
        h('span', 'Taking too long? Increase the gas price on your transaction'),
      ]),

    ]), // holding on icon from design
  ])
}

TxListItem.prototype.txStatusIndicator = function () {
  const { transactionStatus } = this.props

  let name

  if (transactionStatus === 'unapproved') {
    name = this.context.t('unapproved')
  } else if (transactionStatus === 'rejected') {
    name = this.context.t('rejected')
  } else if (transactionStatus === 'approved') {
    name = this.context.t('approved')
  } else if (transactionStatus === 'signed') {
    name = this.context.t('signed')
  } else if (transactionStatus === 'submitted') {
    name = this.context.t('submitted')
  } else if (transactionStatus === 'confirmed') {
    name = this.context.t('confirmed')
  } else if (transactionStatus === 'failed') {
    name = this.context.t('failed')
  } else if (transactionStatus === 'dropped') {
    name = this.context.t('dropped')
  }
  return name
}
