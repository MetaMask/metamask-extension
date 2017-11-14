const inherits = require('util').inherits
const Component = require('react').Component
const classnames = require('classnames')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
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
    keys: ['address', 'name', 'symbol'],
})
const actions = require('./actions')
const ethUtil = require('ethereumjs-util')
const { tokenInfoGetter } = require('./token-util')
const R = require('ramda')

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
    customDecimals: 0,
    searchQuery: '',
    isCollapsed: true,
    selectedTokens: {},
    errors: {},
  }
  this.tokenAddressDidChange = this.tokenAddressDidChange.bind(this)
  this.onNext = this.onNext.bind(this)
  Component.call(this)
}

AddTokenScreen.prototype.componentWillMount = function () {
  this.tokenInfoGetter = tokenInfoGetter()
}

AddTokenScreen.prototype.toggleToken = function (address, token) {
  const { selectedTokens, errors } = this.state
  const { [address]: selectedToken } = selectedTokens
  this.setState({
    selectedTokens: {
      ...selectedTokens,
      [address]: selectedToken ? null : token,
    },
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
      errors.customAddress = 'Address is invalid. '
    }

    const validDecimals = customDecimals >= 0 && customDecimals < 36
    if (!validDecimals) {
      errors.customDecimals = 'Decimals must be at least 0, and not over 36.'
    }

    const symbolLen = customSymbol.trim().length
    const validSymbol = symbolLen > 0 && symbolLen < 10
    if (!validSymbol) {
      errors.customSymbol = 'Symbol must be between 0 and 10 characters.'
    }

    const ownAddress = identitiesList.includes(standardAddress)
    if (ownAddress) {
      errors.customAddress = 'Personal address detected. Input the token contract address.'
    }

    const tokenAlreadyAdded = this.checkExistingAddresses(customAddress)
    if (tokenAlreadyAdded) {
      errors.customAddress = 'Token has already been added.'
    }
  } else if (
    Object.entries(selectedTokens)
      .reduce((isEmpty, [ symbol, isSelected ]) => (
        isEmpty && !isSelected
      ), true)
  ) {
    errors.tokenSelector = 'Must select at least 1 token.'
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
    })
  }
}

AddTokenScreen.prototype.renderCustomForm = function () {
  const { customAddress, customSymbol, customDecimals, errors } = this.state

  return !this.state.isCollapsed && (
    h('div.add-token__add-custom-form', [
      h('div', {
        className: classnames('add-token__add-custom-field', {
          'add-token__add-custom-field--error': errors.customAddress,
        }),
      }, [
        h('div.add-token__add-custom-label', 'Token Address'),
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
        h('div.add-token__add-custom-label', 'Token Symbol'),
        h('input.add-token__add-custom-input', {
          type: 'text',
          value: customSymbol,
          disabled: true,
        }),
        h('div.add-token__add-custom-error-message', errors.customSymbol),
      ]),
      h('div', {
        className: classnames('add-token__add-custom-field', {
          'add-token__add-custom-field--error': errors.customDecimals,
        }),
      }, [
        h('div.add-token__add-custom-label', 'Decimals of Precision'),
        h('input.add-token__add-custom-input', {
          type: 'number',
          value: customDecimals,
          disabled: true,
        }),
        h('div.add-token__add-custom-error-message', errors.customDecimals),
      ]),
    ])
  )
}

AddTokenScreen.prototype.renderTokenList = function () {
  const { searchQuery = '', selectedTokens } = this.state
  const results = searchQuery
    ? fuse.search(searchQuery) || []
    : contractList

  return Array(6).fill(undefined)
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
              backgroundImage: `url(images/contract/${logo})`,
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
    })
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
          h('div.add-token__title', 'Add Token'),
          h('div.add-token__description', 'Would you like to add these tokens?'),
        ]),
        h('div.add-token__content-container.add-token__confirmation-content', [
          h('div.add-token__description.add-token__confirmation-description', 'Your balances'),
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
        h('button.btn-secondary', {
          onClick: () => addTokens(tokens).then(goHome),
        }, 'Add Tokens'),
        h('button.btn-tertiary', {
          onClick: () => this.setState({ isShowingConfirmation: false }),
        }, 'Back'),
      ]),
    ])
  )
}

AddTokenScreen.prototype.render = function () {
  const { isCollapsed, errors, isShowingConfirmation } = this.state
  const { goHome } = this.props

  return isShowingConfirmation
    ? this.renderConfirmation()
    : (
    h('div.add-token', [
      h('div.add-token__wrapper', [
        h('div.add-token__title-container', [
          h('div.add-token__title', 'Add Token'),
          h('div.add-token__description', 'Keep track of the tokens you’ve bought with your MetaMask account. If you bought tokens using a different account, those tokens will not appear here.'),
          h('div.add-token__description', 'Search for tokens or select from our list of popular tokens.'),
        ]),
        h('div.add-token__content-container', [
          h('div.add-token__input-container', [
            h('input.add-token__input', {
              type: 'text',
              placeholder: 'Search',
              onChange: e => this.setState({ searchQuery: e.target.value }),
            }),
            h('div.add-token__search-input-error-message', errors.tokenSelector),
          ]),
          h(
            'div.add-token__token-icons-container',
            this.renderTokenList(),
          ),
        ]),
        h('div.add-token__footers', [
          h('div.add-token__add-custom', {
            onClick: () => this.setState({ isCollapsed: !isCollapsed }),
          }, [
            'Add custom token',
            h(`i.fa.fa-angle-${isCollapsed ? 'down' : 'up'}`),
          ]),
          this.renderCustomForm(),
        ]),
      ]),
      h('div.add-token__buttons', [
        h('button.btn-secondary', {
          onClick: this.onNext,
        }, 'Next'),
        h('button.btn-tertiary', {
          onClick: goHome,
        }, 'Cancel'),
      ]),
    ])
  )
}
