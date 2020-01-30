import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper'
import Identicon from '../../../../components/ui/identicon/identicon.component'
import TokenBalance from '../../../../components/ui/token-balance'
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display'
import {PRIMARY} from '../../../../helpers/constants/common'

export default class SendAssetRow extends Component {
  static propTypes = {
    tokens: PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string,
        decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        symbol: PropTypes.string,
      })
    ).isRequired,
    accounts: PropTypes.object.isRequired,
    selectedAddress: PropTypes.string.isRequired,
    selectedTokenAddress: PropTypes.string,
    setSelectedToken: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  state = {
    isShowingDropdown: false,
  }

  openDropdown = () => this.setState({ isShowingDropdown: true })

  closeDropdown = () => this.setState({ isShowingDropdown: false })

  selectToken = address => {
    this.setState({
      isShowingDropdown: false,
    }, () => {
      this.context.metricsEvent({
        eventOpts: {
          category: 'Transactions',
          action: 'Send Screen',
          name: 'User clicks "Assets" dropdown',
        },
        customVariables: {
          assetSelected: address ? 'ERC20' : 'ETH',
        },
      })
      this.props.setSelectedToken(address)
    })
  }

  render () {
    const { t } = this.context

    return (
      <SendRowWrapper label={`${t('asset')}:`}>
        <div className="send-v2__asset-dropdown">
          { this.renderSelectedToken() }
          { this.props.tokens.length > 0 ? this.renderAssetDropdown() : null }
        </div>
      </SendRowWrapper>
    )
  }

  renderSelectedToken () {
    const { selectedTokenAddress } = this.props
    const token = this.props.tokens.find(({ address }) => address === selectedTokenAddress)
    return (
      <div
        className="send-v2__asset-dropdown__input-wrapper"
        onClick={this.openDropdown}
      >
        { token ? this.renderAsset(token) : this.renderEth() }
      </div>
    )
  }

  renderAssetDropdown () {
    return this.state.isShowingDropdown && (
      <div>
        <div
          className="send-v2__asset-dropdown__close-area"
          onClick={this.closeDropdown}
        />
        <div className="send-v2__asset-dropdown__list">
          { this.renderEth() }
          { this.props.tokens.map(token => this.renderAsset(token)) }
        </div>
      </div>
    )
  }

  renderEth () {
    const { t } = this.context
    const { accounts, selectedAddress } = this.props

    const balanceValue = accounts[selectedAddress] ? accounts[selectedAddress].balance : ''

    return (
      <div
        className={ this.props.tokens.length > 0 ? 'send-v2__asset-dropdown__asset' : 'send-v2__asset-dropdown__single-asset' }
        onClick={() => this.selectToken()}
      >
        <div className="send-v2__asset-dropdown__asset-icon">
          <Identicon diameter={36} />
        </div>
        <div className="send-v2__asset-dropdown__asset-data">
          <div className="send-v2__asset-dropdown__symbol">ETH</div>
          <div className="send-v2__asset-dropdown__name">
            <span className="send-v2__asset-dropdown__name__label">{`${t('balance')}:`}</span>
            <UserPreferencedCurrencyDisplay
              value={balanceValue}
              type={PRIMARY}
            />
          </div>
        </div>
      </div>
    )
  }


  renderAsset (token) {
    const { address, symbol } = token
    const { t } = this.context

    return (
      <div
        key={address} className="send-v2__asset-dropdown__asset"
        onClick={() => this.selectToken(address)}
      >
        <div className="send-v2__asset-dropdown__asset-icon">
          <Identicon address={address} diameter={36} />
        </div>
        <div className="send-v2__asset-dropdown__asset-data">
          <div className="send-v2__asset-dropdown__symbol">
            { symbol }
          </div>
          <div className="send-v2__asset-dropdown__name">
            <span className="send-v2__asset-dropdown__name__label">{`${t('balance')}:`}</span>
            <TokenBalance
              token={token}
              withSymbol
            />
          </div>
        </div>
      </div>
    )
  }
}
