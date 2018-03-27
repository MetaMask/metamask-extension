const inherits = require('util').inherits
const Component = require('react').Component
const classnames = require('classnames')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const R = require('ramda')
const Fuse = require('fuse.js')
const contractMap = require('eth-contract-metadata')
const TokenBalance = require('./components/token-balance')
const Identicon = require('./components/identicon')
const contractList = Object.entries(contractMap)
  .map(([ _, tokenData]) => tokenData)
  .filter(tokenData => Boolean(tokenData.erc20))
const fuse = new Fuse(contractList, {
    shouldSort: true,
    threshold: 0.45,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'symbol', weight: 0.5 },
    ],
})
const actions = require('./actions')
const ethUtil = require('ethereumjs-util')
const { tokenInfoGetter } = require('./token-util')
const t = require('../i18n')

const emptyAddr = '0x0000000000000000000000000000000000000000'

module.exports = connect(mapStateToProps, mapDispatchToProps)(AddTokenScreen)

function mapStateToProps (state) {
  const { identities, tokens } = state.metamask
  return {
    identities,
    tokens,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    goHome: () => dispatch(actions.goHome()),
    addTokens: tokens => dispatch(actions.addTokens(tokens)),
  }
}

inherits(AddTokenScreen, Component)
function AddTokenScreen () {
  this.state = {
    isShowingConfirmation: false,
    customAddress: '',
    customSymbol: '',
    customDecimals: '',
    searchQuery: '',
    selectedTokens: {},
    errors: {},
    autoFilled: false,
    displayedTab: 'SEARCH',
  }
  this.tokenAddressDidChange = this.tokenAddressDidChange.bind(this)
  this.tokenSymbolDidChange = this.tokenSymbolDidChange.bind(this)
  this.tokenDecimalsDidChange = this.tokenDecimalsDidChange.bind(this)
  this.onNext = this.onNext.bind(this)
  Component.call(this)
}

AddTokenScreen.prototype.componentWillMount = function () {
  this.tokenInfoGetter = tokenInfoGetter()
}

AddTokenScreen.prototype.toggleToken = function (address, token) {
  const { selectedTokens = {}, errors } = this.state
  const selectedTokensCopy = { ...selectedTokens }

  if (address in selectedTokensCopy) {
    delete selectedTokensCopy[address]
  } else {
    selectedTokensCopy[address] = token
  }

  this.setState({
    selectedTokens: selectedTokensCopy,
    errors: {
      ...errors,
      tokenSelector: null,
    },
  })
}

AddTokenScreen.prototype.onNext = function () {
  const { isValid, errors } = this.validate()

  return !isValid
    ? this.setState({ errors })
    : this.setState({ isShowingConfirmation: true })
}

AddTokenScreen.prototype.tokenAddressDidChange = function (e) {
  const customAddress = e.target.value.trim()
  this.setState({ customAddress })
  if (ethUtil.isValidAddress(customAddress) && customAddress !== emptyAddr) {
    this.attemptToAutoFillTokenParams(customAddress)
  } else {
    this.setState({
      customSymbol: '',
      customDecimals: 0,
    })
  }
}

AddTokenScreen.prototype.tokenSymbolDidChange = function (e) {
  const customSymbol = e.target.value.trim()
  this.setState({ customSymbol })
}

AddTokenScreen.prototype.tokenDecimalsDidChange = function (e) {
  const customDecimals = e.target.value.trim()
  this.setState({ customDecimals })
}

AddTokenScreen.prototype.checkExistingAddresses = function (address) {
  if (!address) return false
  const tokensList = this.props.tokens
  const matchesAddress = existingToken => {
    return existingToken.address.toLowerCase() === address.toLowerCase()
  }

  return R.any(matchesAddress)(tokensList)
}

AddTokenScreen.prototype.validate = function () {
  const errors = {}
  const identitiesList = Object.keys(this.props.identities)
  const { customAddress, customSymbol, customDecimals, selectedTokens } = this.state
  const standardAddress = ethUtil.addHexPrefix(customAddress).toLowerCase()

  if (customAddress) {
    const validAddress = ethUtil.isValidAddress(customAddress)
    if (!validAddress) {
      errors.customAddress = t('invalidAddress')
    }

    const validDecimals = customDecimals !== null && customDecimals >= 0 && customDecimals < 36
    if (!validDecimals) {
      errors.customDecimals = t('decimalsMustZerotoTen')
    }

    const symbolLen = customSymbol.trim().length
    const validSymbol = symbolLen > 0 && symbolLen < 10
    if (!validSymbol) {
      errors.customSymbol = t('symbolBetweenZeroTen')
    }

    const ownAddress = identitiesList.includes(standardAddress)
    if (ownAddress) {
      errors.customAddress = t('personalAddressDetected')
    }

    const tokenAlreadyAdded = this.checkExistingAddresses(customAddress)
    if (tokenAlreadyAdded) {
      errors.customAddress = t('tokenAlreadyAdded')
    }
  } else if (
    Object.entries(selectedTokens)
      .reduce((isEmpty, [ symbol, isSelected ]) => (
        isEmpty && !isSelected
      ), true)
  ) {
    errors.tokenSelector = t('mustSelectOne')
  }

  return {
    isValid: !Object.keys(errors).length,
    errors,
  }
}

AddTokenScreen.prototype.attemptToAutoFillTokenParams = async function (address) {
  const { symbol, decimals } = await this.tokenInfoGetter(address)
  if (symbol && decimals) {
    this.setState({
      customSymbol: symbol,
      customDecimals: decimals.toString(),
      autoFilled: true,
    })
  }
}

AddTokenScreen.prototype.renderCustomForm = function () {
  const { autoFilled, customAddress, customSymbol, customDecimals, errors } = this.state

  return (
    h('div.add-token__add-custom-form', [
      h('div', {
        className: classnames('add-token__add-custom-field', {
          'add-token__add-custom-field--error': errors.customAddress,
        }),
      }, [
        h('div.add-token__add-custom-label', t('tokenAddress')),
        h('input.add-token__add-custom-input', {
          type: 'text',
          onChange: this.tokenAddressDidChange,
          value: customAddress,
        }),
        h('div.add-token__add-custom-error-message', errors.customAddress),
      ]),
      h('div', {
        className: classnames('add-token__add-custom-field', {
          'add-token__add-custom-field--error': errors.customSymbol,
        }),
      }, [
        h('div.add-token__add-custom-label', t('tokenSymbol')),
        h('input.add-token__add-custom-input', {
          type: 'text',
          onChange: this.tokenSymbolDidChange,
          value: customSymbol,
          disabled: autoFilled,
        }),
        h('div.add-token__add-custom-error-message', errors.customSymbol),
      ]),
      h('div', {
        className: classnames('add-token__add-custom-field', {
          'add-token__add-custom-field--error': errors.customDecimals,
        }),
      }, [
        h('div.add-token__add-custom-label', t('decimal')),
        h('input.add-token__add-custom-input', {
          type: 'number',
          onChange: this.tokenDecimalsDidChange,
          value: customDecimals,
          disabled: autoFilled,
        }),
        h('div.add-token__add-custom-error-message', errors.customDecimals),
      ]),
    ])
  )
}

AddTokenScreen.prototype.renderTokenList = function () {
  const { searchQuery = '', selectedTokens } = this.state
  const fuseSearchResult = fuse.search(searchQuery)
  const addressSearchResult = contractList.filter(token => {
    return token.address.toLowerCase() === searchQuery.toLowerCase()
  })
  const results = [...addressSearchResult, ...fuseSearchResult]

  return h('div', [
      results.length > 0 && h('div.add-token__token-icons-title', t('popularTokens')),
      h('div.add-token__token-icons-container', Array(6).fill(undefined)
        .map((_, i) => {
          const { logo, symbol, name, address } = results[i] || {}
          const tokenAlreadyAdded = this.checkExistingAddresses(address)
          return Boolean(logo || symbol || name) && (
            h('div.add-token__token-wrapper', {
              className: classnames({
                'add-token__token-wrapper--selected': selectedTokens[address],
                'add-token__token-wrapper--disabled': tokenAlreadyAdded,
              }),
              onClick: () => !tokenAlreadyAdded && this.toggleToken(address, results[i]),
            }, [
              h('div.add-token__token-icon', {
                style: {
                  backgroundImage: logo && `url(images/contract/${logo})`,
                },
              }),
              h('div.add-token__token-data', [
                h('div.add-token__token-symbol', symbol),
                h('div.add-token__token-name', name),
              ]),
              // tokenAlreadyAdded && (
              //   h('div.add-token__token-message', 'Already added')
              // ),
            ])
          )
      })),
    ])
}

AddTokenScreen.prototype.renderConfirmation = function () {
  const {
    customAddress: address,
    customSymbol: symbol,
    customDecimals: decimals,
    selectedTokens,
  } = this.state

  const { addTokens, goHome } = this.props

  const customToken = {
    address,
    symbol,
    decimals,
  }

  const tokens = address && symbol && decimals
    ? { ...selectedTokens, [address]: customToken }
    : selectedTokens

  return (
    h('div.add-token', [
      h('div.add-token__wrapper', [
        h('div.add-token__title-container.add-token__confirmation-title', [
          h('div.add-token__description', t('likeToAddTokens')),
        ]),
        h('div.add-token__content-container.add-token__confirmation-content', [
          h('div.add-token__description.add-token__confirmation-description', t('balances')),
          h('div.add-token__confirmation-token-list',
            Object.entries(tokens)
              .map(([ address, token ]) => (
                h('span.add-token__confirmation-token-list-item', [
                  h(Identicon, {
                    className: 'add-token__confirmation-token-icon',
                    diameter: 75,
                    address,
                  }),
                  h(TokenBalance, { token }),
                ])
              ))
          ),
        ]),
      ]),
      h('div.add-token__buttons', [
        h('button.btn-secondary--lg.add-token__cancel-button', {
          onClick: () => this.setState({ isShowingConfirmation: false }),
        }, t('back')),
        h('button.btn-primary--lg', {
          onClick: () => addTokens(tokens).then(goHome),
        }, t('addTokens')),
      ]),
    ])
  )
}

AddTokenScreen.prototype.displayTab = function (selectedTab) {
  this.setState({ displayedTab: selectedTab })
}

AddTokenScreen.prototype.renderTabs = function () {
  const { displayedTab, errors } = this.state

  return displayedTab === 'CUSTOM_TOKEN'
    ? this.renderCustomForm()
    : h('div', [
    h('div.add-token__wrapper', [
      h('div.add-token__content-container', [
        h('div.add-token__info-box', [
          h('div.add-token__info-box__close'),
          h('div.add-token__info-box__title', t('whatsThis')),
          h('div.add-token__info-box__copy', t('keepTrackTokens')),
          h('div.add-token__info-box__copy--blue', t('learnMore')),
        ]),
        h('div.add-token__input-container', [
          h('input.add-token__input', {
            type: 'text',
            placeholder: t('searchTokens'),
            onChange: e => this.setState({ searchQuery: e.target.value }),
          }),
          h('div.add-token__search-input-error-message', errors.tokenSelector),
        ]),
        this.renderTokenList(),
      ]),
    ]),
  ])
}

AddTokenScreen.prototype.render = function () {
  const {
    isShowingConfirmation,
    displayedTab,
  } = this.state
  const { goHome } = this.props

  return h('div.add-token', [
    h('div.add-token__header', [
      h('div.add-token__header__cancel', {
        onClick: () => goHome(),
      }, [
        h('i.fa.fa-angle-left.fa-lg'),
        h('span', t('cancel')),
      ]),
      h('div.add-token__header__title', t('addTokens')),
      !isShowingConfirmation && h('div.add-token__header__tabs', [

        h('div.add-token__header__tabs__tab', {
          className: classnames('add-token__header__tabs__tab', {
            'add-token__header__tabs__selected': displayedTab === 'SEARCH',
            'add-token__header__tabs__unselected cursor-pointer': displayedTab !== 'SEARCH',
          }),
          onClick: () => this.displayTab('SEARCH'),
        }, t('search')),

        h('div.add-token__header__tabs__tab', {
          className: classnames('add-token__header__tabs__tab', {
            'add-token__header__tabs__selected': displayedTab === 'CUSTOM_TOKEN',
            'add-token__header__tabs__unselected cursor-pointer': displayedTab !== 'CUSTOM_TOKEN',
          }),
          onClick: () => this.displayTab('CUSTOM_TOKEN'),
        }, t('customToken')),

      ]),
    ]),
//
    isShowingConfirmation
      ? this.renderConfirmation()
      : this.renderTabs(),

    !isShowingConfirmation && h('div.add-token__buttons', [
      h('button.btn-secondary--lg.add-token__cancel-button', {
        onClick: goHome,
      }, t('cancel')),
      h('button.btn-primary--lg.add-token__confirm-button', {
        onClick: this.onNext,
      }, t('next')),
    ]),
  ])
}
