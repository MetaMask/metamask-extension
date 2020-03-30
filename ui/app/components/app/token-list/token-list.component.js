import React, { Component } from 'react'
import PropTypes from 'prop-types'
import TokenTracker from '@metamask/eth-token-tracker'
import { isEqual } from 'lodash'
import contracts from 'eth-contract-metadata'

import { I18nContext } from '../../../contexts/i18n'
import TokenCell from '../token-cell'

const defaultTokens = []
for (const address in contracts) {
  const contract = contracts[address]
  if (contract.erc20) {
    contract.address = address
    defaultTokens.push(contract)
  }
}

class TokenList extends Component {
  static contextType = I18nContext

  static propTypes = {
    assetImages: PropTypes.object.isRequired,
    network: PropTypes.string.isRequired,
    onTokenClick: PropTypes.func.isRequired,
    tokens: PropTypes.array.isRequired,
    userAddress: PropTypes.string.isRequired,
  }

  constructor () {
    super()

    this.state = {
      error: null,
      tokensLoading: false,
      tokensWithBalances: [],
    }
  }

  constructTokenTracker () {
    const { network, tokens, userAddress } = this.props
    if (!tokens || !tokens.length) {
      this.setState({
        tokensLoading: false,
        tokensWithBalances: [],
      })
      return
    }
    this.setState({ tokensLoading: true })

    if (!userAddress || network === 'loading' || !global.ethereumProvider) {
      return
    }

    const updateBalances = (tokensWithBalances) => {
      this.setState({
        error: null,
        tokensLoading: false,
        tokensWithBalances,
      })
    }
    const showError = (error) => {
      this.setState({
        error,
        tokensLoading: false,
      })
    }

    this.tokenTracker = new TokenTracker({
      userAddress,
      provider: global.ethereumProvider,
      tokens: tokens,
      pollingInterval: 8000,
    })

    this.tokenTracker.on('update', updateBalances)
    this.tokenTracker.on('error', showError)
    this.tokenTracker.updateBalances()
  }

  stopTokenTracker () {
    if (this.tokenTracker) {
      this.tokenTracker.stop()
      this.tokenTracker.removeAllListeners('update')
      this.tokenTracker.removeAllListeners('error')
    }
  }

  componentDidMount () {
    this.constructTokenTracker()
  }

  componentDidUpdate (prevProps) {
    const { network, tokens, userAddress } = this.props
    if (
      isEqual(tokens, prevProps.tokens) &&
      userAddress === prevProps.userAddress &&
      network === prevProps.network
    ) {
      return
    }
    this.stopTokenTracker()
    this.constructTokenTracker()
  }

  componentWillUnmount () {
    this.stopTokenTracker()
  }

  render () {
    const t = this.context
    const { error, tokensLoading, tokensWithBalances } = this.state
    const { assetImages, network, onTokenClick, userAddress } = this.props
    if (network === 'loading' || tokensLoading) {
      return (
        <div
          style={{
            display: 'flex',
            height: '250px',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px',
          }}
        >
          {t('loadingTokens')}
        </div>
      )
    }

    if (error) {
      return (
        <div
          className="hotFix"
          style={{
            padding: '80px',
          }}
        >
          {t('troubleTokenBalances')}
          <span
            className="hotFix"
            style={{
              color: 'rgba(247, 134, 28, 1)',
              cursor: 'pointer',
            }}
            onClick={() => {
              global.platform.openWindow({
                url: `https://ethplorer.io/address/${userAddress}`,
              })
            }}
          >
            {t('here')}
          </span>
        </div>
      )
    }

    return (
      <div>
        {tokensWithBalances.map((tokenData, index) => {
          tokenData.image = assetImages[tokenData.address]
          return (
            <TokenCell key={index} {...tokenData} onClick={onTokenClick} />
          )
        })}
      </div>
    )
  }
}

export default TokenList
