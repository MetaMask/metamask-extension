import PropTypes from 'prop-types'
import React, { Component } from 'react'
import AddTokenButton from '../add-token-button'
import TokenList from '../token-list'
import { ADD_TOKEN_ROUTE } from '../../../helpers/constants/routes'
import AssetListItem from '../asset-list-item'
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display'
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common'

export default class AssetList extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static defaultProps = {
    selectedTokenAddress: undefined,
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
    selectedAccountBalance: PropTypes.string,
    selectedTokenAddress: PropTypes.string,
    setSelectedToken: PropTypes.func.isRequired,
    showFiat: PropTypes.bool.isRequired,
    unsetSelectedToken: PropTypes.func.isRequired,
  }

  renderWalletBalance () {
    const {
      selectedAccountBalance,
      selectedTokenAddress,
      showFiat,
      unsetSelectedToken,
    } = this.props

    return (
      <AssetListItem
        active={!selectedTokenAddress}
        onClick={unsetSelectedToken}
        data-testid="wallet-balance"
      >
        <UserPreferencedCurrencyDisplay
          className="asset-list__primary-amount"
          ethNumberOfDecimals={4}
          type={PRIMARY}
          value={selectedAccountBalance}
        />
        {
          showFiat && (
            <UserPreferencedCurrencyDisplay
              className="asset-list__secondary-amount"
              ethNumberOfDecimals={4}
              type={SECONDARY}
              value={selectedAccountBalance}
            />
          )
        }
      </AssetListItem>
    )
  }

  renderAddToken () {
    const {
      history,
    } = this.props
    const { metricsEvent } = this.context

    return (
      <AddTokenButton
        onClick={() => {
          history.push(ADD_TOKEN_ROUTE)
          metricsEvent({
            eventOpts: {
              category: 'Navigation',
              action: 'Token Menu',
              name: 'Clicked "Add Token"',
            },
          })
        }}
      />
    )
  }

  render () {
    const { setSelectedToken } = this.props
    return (
      <>
        {this.renderWalletBalance()}
        <TokenList
          onTokenClick={(tokenAddress) => {
            setSelectedToken(tokenAddress)
            this.context.metricsEvent({
              eventOpts: {
                category: 'Navigation',
                action: 'Token Menu',
                name: 'Clicked Token',
              },
            })
          }}
        />
        {this.renderAddToken()}
      </>
    )
  }
}
