<<<<<<< HEAD
const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const TokenTracker = require('eth-token-tracker')
const TokenCell = require('./token-cell.js')
const connect = require('react-redux').connect
const selectors = require('../../selectors/selectors')
const log = require('loglevel')
=======
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import TokenCell from './token-cell'
import TokenTracker from 'eth-token-tracker'
import { connect } from 'react-redux'
import { getSelectedAddress } from '../../selectors/selectors'
import log from 'loglevel'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    tokens: state.metamask.tokens,
    userAddress: getSelectedAddress(state),
    assetImages: state.metamask.assetImages,
  }
}

const defaultTokens = []
import contracts from 'eth-contract-metadata'

for (const address in contracts) {
  const contract = contracts[address]
  if (contract.erc20) {
    contract.address = address
    defaultTokens.push(contract)
  }
}

class TokenList extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

<<<<<<< HEAD
TokenList.prototype.render = function () {
  const { userAddress, assetImages } = this.props
  const state = this.state
  const { tokens, isLoading, error } = state
  if (isLoading) {
    return this.message(this.context.t('loadingTokens'))
  }

  if (error) {
    log.error(error)
    return h('.hotFix', {
      style: {
        padding: '80px',
      },
    }, [
      this.context.t('troubleTokenBalances'),
      h('span.hotFix', {
        style: {
          color: 'rgba(247, 134, 28, 1)',
          cursor: 'pointer',
        },
        onClick: () => {
          global.platform.openWindow({
            url: `https://ethplorer.io/address/${userAddress}`,
          })
        },
      }, this.context.t('here')),
    ])
  }

  return h('div', tokens.map((tokenData) => {
    tokenData.image = assetImages[tokenData.address]
    return h(TokenCell, tokenData)
  }))

}

TokenList.prototype.message = function (body) {
  return h('div', {
    style: {
      display: 'flex',
      height: '250px',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '30px',
    },
  }, body)
}
=======
  static propTypes = {
    tokens: PropTypes.array.isRequired,
    userAddress: PropTypes.string.isRequired,
    network: PropTypes.string.isRequired,
    assetImages: PropTypes.object.isRequired,
  }

  state = {
    tokens: [],
    isLoading: true,
  }

  createFreshTokenTracker () {
    if (this.tracker) {
      // Clean up old trackers when refreshing:
      this.tracker.stop()
      this.tracker.removeListener('update', this.balanceUpdater)
      this.tracker.removeListener('error', this.showError)
    }

    if (!global.ethereumProvider) {
      return
    }
    const { userAddress } = this.props

    this.tracker = new TokenTracker({
      userAddress,
      provider: global.ethereumProvider,
      tokens: this.props.tokens,
      pollingInterval: 8000,
    })
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc


    // Set up listener instances for cleaning up
    this.balanceUpdater = this.updateBalances.bind(this)
    this.showError = (error) => {
      this.setState({ error, isLoading: false })
    }
    this.tracker.on('update', this.balanceUpdater)
    this.tracker.on('error', this.showError)

    this.tracker.updateBalances()
      .then(() => {
        this.updateBalances(this.tracker.serialize())
      })
      .catch((reason) => {
        log.error(`Problem updating balances`, reason)
        this.setState({ isLoading: false })
      })
  }

<<<<<<< HEAD
  if (!global.ethereumProvider) return
  const { userAddress } = this.props

  this.tracker = new TokenTracker({
    userAddress,
    provider: global.ethereumProvider,
    tokens: this.props.tokens,
    pollingInterval: 8000,
  })
=======
  updateBalances = function (tokens) {
    if (!this.tracker.running) {
      return
    }
    this.setState({ tokens, isLoading: false })
  }
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

  componentDidMount () {
    this.createFreshTokenTracker()
  }

  componentDidUpdate (prevProps) {
    const {
      network: oldNet,
      userAddress: oldAddress,
      tokens,
    } = prevProps
    const {
      network: newNet,
      userAddress: newAddress,
      tokens: newTokens,
    } = this.props

    const isLoading = newNet === 'loading'
    const missingInfo = !oldNet || !newNet || !oldAddress || !newAddress
    const sameUserAndNetwork = oldAddress === newAddress && oldNet === newNet
    const shouldUpdateTokens = isLoading || missingInfo || sameUserAndNetwork

    const oldTokensLength = tokens ? tokens.length : 0
    const tokensLengthUnchanged = oldTokensLength === newTokens.length

    if (tokensLengthUnchanged && shouldUpdateTokens) {
      return
    }

    this.setState({ isLoading: true })
    this.createFreshTokenTracker()
  }

<<<<<<< HEAD
TokenList.prototype.componentDidUpdate = function (prevProps) {
  const {
    network: oldNet,
    userAddress: oldAddress,
    tokens,
  } = prevProps
  const {
    network: newNet,
    userAddress: newAddress,
    tokens: newTokens,
  } = this.props

  const isLoading = newNet === 'loading'
  const missingInfo = !oldNet || !newNet || !oldAddress || !newAddress
  const sameUserAndNetwork = oldAddress === newAddress && oldNet === newNet
  const shouldUpdateTokens = isLoading || missingInfo || sameUserAndNetwork

  const oldTokensLength = tokens ? tokens.length : 0
  const tokensLengthUnchanged = oldTokensLength === newTokens.length

  if (tokensLengthUnchanged && shouldUpdateTokens) return
=======
  componentWillUnmount () {
    if (!this.tracker) {
      return
    }
    this.tracker.stop()
    this.tracker.removeListener('update', this.balanceUpdater)
    this.tracker.removeListener('error', this.showError)
  }
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

  render () {
    const { userAddress, assetImages } = this.props
    const state = this.state
    const { tokens, isLoading, error } = state
    if (isLoading) {
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
          {this.context.t('loadingTokens')}
        </div>
      )
    }

    if (error) {
      log.error(error)
      return (
        <div
          className="hotFix"
          style={{
            padding: '80px',
          }}
        >
          {this.context.t('troubleTokenBalances')}
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
            {this.context.t('here')}
          </span>
        </div>
      )
    }

    return (
      <div>
        {tokens.map((tokenData, index) => {
          tokenData.image = assetImages[tokenData.address]
          return (
            <TokenCell key={index} {...tokenData} />
          )
        })}
      </div>
    )
  }
}

<<<<<<< HEAD
TokenList.prototype.componentWillUnmount = function () {
  if (!this.tracker) return
  this.tracker.stop()
  this.tracker.removeListener('update', this.balanceUpdater)
  this.tracker.removeListener('error', this.showError)
}

// function uniqueMergeTokens (tokensA, tokensB = []) {
//   const uniqueAddresses = []
//   const result = []
//   tokensA.concat(tokensB).forEach((token) => {
//     const normal = normalizeAddress(token.address)
//     if (!uniqueAddresses.includes(normal)) {
//       uniqueAddresses.push(normal)
//       result.push(token)
//     }
//   })
//   return result
// }
=======
export default connect(mapStateToProps)(TokenList)
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
