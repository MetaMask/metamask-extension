import React, { Component } from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import ethUtil from 'ethereumjs-util'
import { checkExistingAddresses } from './util'
import { tokenInfoGetter } from '../../../token-util'
import { DEFAULT_ROUTE, CONFIRM_ADD_TOKEN_ROUTE } from '../../../routes'
import Button from '../../button'
import TextField from '../../text-field'
import TokenList from './token-list'
import TokenSearch from './token-search'

const emptyAddr = '0x0000000000000000000000000000000000000000'
const SEARCH_TAB = 'SEARCH'
const CUSTOM_TOKEN_TAB = 'CUSTOM_TOKEN'

class AddToken extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object,
    setPendingTokens: PropTypes.func,
    pendingTokens: PropTypes.object,
    clearPendingTokens: PropTypes.func,
    tokens: PropTypes.array,
    identities: PropTypes.object,
  }

  constructor (props) {
    super(props)

    this.state = {
      customAddress: '',
      customSymbol: '',
      customDecimals: 0,
      searchResults: [],
      selectedTokens: {},
      tokenSelectorError: null,
      customAddressError: null,
      customSymbolError: null,
      customDecimalsError: null,
      autoFilled: false,
      displayedTab: SEARCH_TAB,
    }
  }

  componentDidMount () {
    this.tokenInfoGetter = tokenInfoGetter()
    const { pendingTokens = {} } = this.props
    const pendingTokenKeys = Object.keys(pendingTokens)

    if (pendingTokenKeys.length > 0) {
      let selectedTokens = {}
      let customToken = {}

      pendingTokenKeys.forEach(tokenAddress => {
        const token = pendingTokens[tokenAddress]
        const { isCustom } = token

        if (isCustom) {
          customToken = { ...token }
        } else {
          selectedTokens = { ...selectedTokens, [tokenAddress]: { ...token } }
        }
      })

      const {
        address: customAddress = '',
        symbol: customSymbol = '',
        decimals: customDecimals = 0,
      } = customToken

      const displayedTab = Object.keys(selectedTokens).length > 0 ? SEARCH_TAB : CUSTOM_TOKEN_TAB
      this.setState({ selectedTokens, customAddress, customSymbol, customDecimals, displayedTab })
    }
  }

  handleToggleToken (token) {
    const { address } = token
    const { selectedTokens = {} } = this.state
    const selectedTokensCopy = { ...selectedTokens }

    if (address in selectedTokensCopy) {
      delete selectedTokensCopy[address]
    } else {
      selectedTokensCopy[address] = token
    }

    this.setState({
      selectedTokens: selectedTokensCopy,
      tokenSelectorError: null,
    })
  }

  hasError () {
    const {
      tokenSelectorError,
      customAddressError,
      customSymbolError,
      customDecimalsError,
    } = this.state

    return tokenSelectorError || customAddressError || customSymbolError || customDecimalsError
  }

  hasSelected () {
    const { customAddress = '', selectedTokens = {} } = this.state
    return customAddress || Object.keys(selectedTokens).length > 0
  }

  handleNext () {
    if (this.hasError()) {
      return
    }

    if (!this.hasSelected()) {
      this.setState({ tokenSelectorError: this.context.t('mustSelectOne') })
      return
    }

    const { setPendingTokens, history } = this.props
    const {
      customAddress: address,
      customSymbol: symbol,
      customDecimals: decimals,
      selectedTokens,
    } = this.state

    const customToken = {
      address,
      symbol,
      decimals,
    }

    setPendingTokens({ customToken, selectedTokens })
    history.push(CONFIRM_ADD_TOKEN_ROUTE)
  }

  async attemptToAutoFillTokenParams (address) {
    const { symbol = '', decimals = 0 } = await this.tokenInfoGetter(address)

    const autoFilled = Boolean(symbol && decimals)
    this.setState({ autoFilled })
    this.handleCustomSymbolChange(symbol || '')
    this.handleCustomDecimalsChange(decimals)
  }

  handleCustomAddressChange (value) {
    const customAddress = value.trim()
    this.setState({
      customAddress,
      customAddressError: null,
      tokenSelectorError: null,
      autoFilled: false,
    })

    const isValidAddress = ethUtil.isValidAddress(customAddress)
    const standardAddress = ethUtil.addHexPrefix(customAddress).toLowerCase()

    switch (true) {
      case !isValidAddress:
        this.setState({
          customAddressError: this.context.t('invalidAddress'),
          customSymbol: '',
          customDecimals: 0,
          customSymbolError: null,
          customDecimalsError: null,
        })

        break
      case Boolean(this.props.identities[standardAddress]):
        this.setState({
          customAddressError: this.context.t('personalAddressDetected'),
        })

        break
      case checkExistingAddresses(customAddress, this.props.tokens):
        this.setState({
          customAddressError: this.context.t('tokenAlreadyAdded'),
        })

        break
      default:
        if (customAddress !== emptyAddr) {
          this.attemptToAutoFillTokenParams(customAddress)
        }
    }
  }

  handleCustomSymbolChange (value) {
    const customSymbol = value.trim()
    const symbolLength = customSymbol.length
    let customSymbolError = null

    if (symbolLength <= 0 || symbolLength >= 10) {
      customSymbolError = this.context.t('symbolBetweenZeroTen')
    }

    this.setState({ customSymbol, customSymbolError })
  }

  handleCustomDecimalsChange (value) {
    const customDecimals = value.trim()
    const validDecimals = customDecimals !== null &&
      customDecimals !== '' &&
      customDecimals >= 0 &&
      customDecimals < 36
    let customDecimalsError = null

    if (!validDecimals) {
      customDecimalsError = this.context.t('decimalsMustZerotoTen')
    }

    this.setState({ customDecimals, customDecimalsError })
  }

  renderCustomTokenForm () {
    const {
      customAddress,
      customSymbol,
      customDecimals,
      customAddressError,
      customSymbolError,
      customDecimalsError,
      autoFilled,
    } = this.state

    return (
      <div className="add-token__custom-token-form">
        <TextField
          id="custom-address"
          label={this.context.t('tokenAddress')}
          type="text"
          value={customAddress}
          onChange={e => this.handleCustomAddressChange(e.target.value)}
          error={customAddressError}
          fullWidth
          margin="normal"
        />
        <TextField
          id="custom-symbol"
          label={this.context.t('tokenSymbol')}
          type="text"
          value={customSymbol}
          onChange={e => this.handleCustomSymbolChange(e.target.value)}
          error={customSymbolError}
          fullWidth
          margin="normal"
          disabled={autoFilled}
        />
        <TextField
          id="custom-decimals"
          label={this.context.t('decimal')}
          type="number"
          value={customDecimals}
          onChange={e => this.handleCustomDecimalsChange(e.target.value)}
          error={customDecimalsError}
          fullWidth
          margin="normal"
          disabled={autoFilled}
        />
      </div>
    )
  }

  renderSearchToken () {
    const { tokenSelectorError, selectedTokens, searchResults } = this.state

    return (
      <div className="add-token__search-token">
        <TokenSearch
          onSearch={({ results = [] }) => this.setState({ searchResults: results })}
          error={tokenSelectorError}
        />
        <div className="add-token__token-list">
          <TokenList
            results={searchResults}
            selectedTokens={selectedTokens}
            onToggleToken={token => this.handleToggleToken(token)}
          />
        </div>
      </div>
    )
  }

  render () {
    const { displayedTab } = this.state
    const { history, clearPendingTokens } = this.props

    return (
      <div className="page-container">
        <div className="page-container__header page-container__header--no-padding-bottom">
          <div className="page-container__title">
            { this.context.t('addTokens') }
          </div>
          <div className="page-container__tabs">
            <div
              className={classnames('page-container__tab', {
                'page-container__tab--selected': displayedTab === SEARCH_TAB,
              })}
              onClick={() => this.setState({ displayedTab: SEARCH_TAB })}
            >
              { this.context.t('search') }
            </div>
            <div
              className={classnames('page-container__tab', {
                'page-container__tab--selected': displayedTab === CUSTOM_TOKEN_TAB,
              })}
              onClick={() => this.setState({ displayedTab: CUSTOM_TOKEN_TAB })}
            >
              { this.context.t('customToken') }
            </div>
          </div>
        </div>
        <div className="page-container__content">
          {
            displayedTab === CUSTOM_TOKEN_TAB
              ? this.renderCustomTokenForm()
              : this.renderSearchToken()
          }
        </div>
        <div className="page-container__footer">
          <Button
            type="default"
            large
            className="page-container__footer-button"
            onClick={() => {
              clearPendingTokens()
              history.push(DEFAULT_ROUTE)
            }}
          >
            { this.context.t('cancel') }
          </Button>
          <Button
            type="primary"
            large
            className="page-container__footer-button"
            onClick={() => this.handleNext()}
            disabled={this.hasError() || !this.hasSelected()}
          >
            { this.context.t('next') }
          </Button>
        </div>
      </div>
    )
  }
}

export default AddToken
