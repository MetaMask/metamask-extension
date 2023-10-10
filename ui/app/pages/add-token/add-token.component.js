import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ethUtil from 'ethereumjs-util'
import contractMap from 'eth-contract-metadata'
import { checkExistingAddresses } from '../../helpers/utils/util'
import { initializeTokenListForSearchability, transformTokensForSearchList } from './add-token.util'
import { tokenInfoGetter } from '../../helpers/utils/token-util'
import { CONFIRM_ADD_TOKEN_ROUTE } from '../../helpers/constants/routes'
import TextField from '../../components/ui/text-field'
import SearchableItemList from '../../components/ui/searchable-item-list'
import TokenListPlaceholder from './token-list-placeholder'
import PageContainer from '../../components/ui/page-container'
import { Tabs, Tab } from '../../components/ui/tabs'

const emptyAddr = '0x0000000000000000000000000000000000000000'

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
    mostRecentOverviewPage: PropTypes.string.isRequired,
  }

  state = {
    customAddress: '',
    customSymbol: '',
    customDecimals: 0,
    tokenSelectorError: null,
    customAddressError: null,
    customSymbolError: null,
    customDecimalsError: null,
    autoFilled: false,
    forceEditSymbol: false,
    tokensToSearch: initializeTokenListForSearchability(contractMap, this.props.tokens, this.props.pendingTokens),
  }

  componentDidMount () {
    this.tokenInfoGetter = tokenInfoGetter()
    const { tokensToSearch } = this.state
    const { pendingTokens = {} } = this.props
    const pendingTokensCopy = { ...pendingTokens }
    if (Object.keys(pendingTokensCopy).length > 0) {
      const newTokensToSearch = [ ...tokensToSearch ]
      let customToken = {}
      Object.entries(pendingTokensCopy).forEach(([tokenAddress, token]) => {
        const { isCustom } = token
        if (isCustom) {
          customToken = { ...token }
        } else if (!checkExistingAddresses(tokenAddress, newTokensToSearch)) {
          newTokensToSearch.push({ ...token, selected: true })
        }
      })

      const {
        address: customAddress = '',
        symbol: customSymbol = '',
        decimals: customDecimals = 0,
      } = customToken

      this.setState({ tokensToSearch: newTokensToSearch, customAddress, customSymbol, customDecimals })
    }
  }

  handleToggleToken (token) {
    const { tokensToSearch = {} } = this.state
    const tokensToSearchCopy = [ ...tokensToSearch ]
    const toggleIndex = tokensToSearchCopy.findIndex((searchToken) => searchToken.address === token.address)
    tokensToSearchCopy[toggleIndex].selected = !tokensToSearchCopy[toggleIndex].selected
    this.setState({
      tokensToSearch: tokensToSearchCopy,
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
    const { customAddress = '', tokensToSearch } = this.state
    return customAddress || tokensToSearch.find((tokenToSearch) => tokenToSearch.selected)
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
      tokensToSearch,
    } = this.state

    const selectedTokens = tokensToSearch
      .reduce((_selectedTokens, tokenToSearch) => {
        return tokenToSearch.selected
          ? { ..._selectedTokens, [tokenToSearch.address]: tokenToSearch }
          : _selectedTokens
      }, {})

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

    if (symbolLength <= 0 || symbolLength >= 12) {
      customSymbolError = this.context.t('symbolBetweenZeroTwelve')
    }

    this.setState({ customSymbol, customSymbolError })
  }

  handleCustomDecimalsChange (value) {
    const customDecimals = value.trim()
    const validDecimals = customDecimals !== null &&
      customDecimals !== '' &&
      customDecimals >= 0 &&
      customDecimals <= 36
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
      forceEditSymbol,
    } = this.state

    return (
      <div className="add-token__custom-token-form">
        <TextField
          id="custom-address"
          label={this.context.t('tokenContractAddress')}
          type="text"
          value={customAddress}
          onChange={(e) => this.handleCustomAddressChange(e.target.value)}
          error={customAddressError}
          fullWidth
          margin="normal"
        />
        <TextField
          id="custom-symbol"
          label={(
            <div className="add-token__custom-symbol__label-wrapper">
              <span className="add-token__custom-symbol__label">
                {this.context.t('tokenSymbol')}
              </span>
              {(autoFilled && !forceEditSymbol) && (
                <div
                  className="add-token__custom-symbol__edit"
                  onClick={() => this.setState({ forceEditSymbol: true })}
                >
                  {this.context.t('edit')}
                </div>
              )}
            </div>
          )}
          type="text"
          value={customSymbol}
          onChange={(e) => this.handleCustomSymbolChange(e.target.value)}
          error={customSymbolError}
          fullWidth
          margin="normal"
          disabled={autoFilled && !forceEditSymbol}
        />
        <TextField
          id="custom-decimals"
          label={this.context.t('decimal')}
          type="number"
          value={customDecimals}
          onChange={(e) => this.handleCustomDecimalsChange(e.target.value)}
          error={customDecimalsError}
          fullWidth
          margin="normal"
          disabled={autoFilled}
        />
      </div>
    )
  }

  renderTabs () {
    const { tokenSelectorError, tokensToSearch } = this.state

    return (
      <Tabs>
        <Tab name={this.context.t('search')}>
          <SearchableItemList
            itemsToSearch={transformTokensForSearchList(tokensToSearch)}
            itemSelectorError={tokenSelectorError}
            onClickItem={(token) => this.handleToggleToken(token)}
            Placeholder={TokenListPlaceholder}
            className="add-token__search-token"
            searchPlaceholderText={this.context.t('searchTokens')}
            fuseSearchKeys={[{ name: 'name', weight: 0.499 }, { name: 'symbol', weight: 0.499 }, { name: 'address', weight: 0.002 }]}
            listTitle={this.context.t('searchResults')}
          />
        </Tab>
        <Tab name={this.context.t('customToken')}>
          { this.renderCustomTokenForm() }
        </Tab>
      </Tabs>
    )
  }

  render () {
    const { history, clearPendingTokens, mostRecentOverviewPage } = this.props

    return (
      <PageContainer
        title={this.context.t('addTokens')}
        tabsComponent={this.renderTabs()}
        onSubmit={() => this.handleNext()}
        disabled={Boolean(this.hasError()) || !this.hasSelected()}
        onCancel={() => {
          clearPendingTokens()
          history.push(mostRecentOverviewPage)
        }}
      />
    )
  }
}

export default AddToken
