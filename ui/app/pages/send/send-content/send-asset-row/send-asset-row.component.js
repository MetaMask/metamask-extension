import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ethUtil from 'ethereumjs-util'
import c from 'classnames';
import SendRowWrapper from '../send-row-wrapper'
import Identicon from '../../../../components/ui/identicon/identicon.component'
import contractMap from 'eth-contract-metadata'
import TokenBalance from '../../../../components/ui/token-balance'

export default class SendAssetRow extends Component {
  static propTypes = {
    tokens: PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string,
        decimals: PropTypes.number,
        symbol: PropTypes.string,
      })
    ).isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    isShowingDropdown: false,
    selectedTokenAddress: '',
    tokenInput: '',
  }

  openDropdown = () => this.setState({ isShowingDropdown: true })

  closeDropdown = () => this.setState({ isShowingDropdown: false })

  handleTokenInputChange = e => {
    this.setState({
      tokenInput: e.target.value,
    })
  }

  render () {
    const { t } = this.context
    const { isShowingDropdown, selectedTokenAddress } = this.state

    return (
      <SendRowWrapper label={`${t('asset')}:`}>
        <div className="send-v2__asset-dropdown">
          { selectedTokenAddress && !isShowingDropdown ? this.renderSelectedToken() : this.renderInput() }
          { this.renderAssetDropdown() }
        </div>
      </SendRowWrapper>
    )
  }

  renderInput () {
    const { t } = this.context

    return (
      <div
        className={c('send-v2__asset-dropdown__input-wrapper', {
          'send-v2__asset-dropdown__input-wrapper--opened': this.state.isShowingDropdown,
        })}
      >
        <input
          type="text"
          placeholder={t('selectAnAsset')}
          className="send-v2__asset-dropdown__input"
          onFocus={this.openDropdown}
          onChange={this.handleTokenInputChange}
          value={this.state.tokenInput}
        />
      </div>
    )
  }

  renderSelectedToken () {
    const { selectedTokenAddress: address } = this.state;
    return (
      <div
        className="send-v2__asset-dropdown__input-wrapper"
        onClick={() => this.setState({ isShowingDropdown: true })}
      >
        { this.renderAsset({ address }) }
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
          { this.props.tokens.map(token => this.renderAsset(token)) }
        </div>
      </div>
    )
  }

  renderAsset ({ address }) {

    const token = contractMap[ethUtil.toChecksumAddress(address)] || {}
    const { name } = token

    return (
      <div
        key={address} className="send-v2__asset-dropdown__asset"
        onClick={() => this.setState({
          selectedTokenAddress: address,
          isShowingDropdown: false,
        })}
      >
        <div className="send-v2__asset-dropdown__asset-icon">
          <Identicon address={address} diameter={18} />
        </div>
        <div className="send-v2__asset-dropdown__asset-data">
          <div className="send-v2__asset-dropdown__symbol">
            <TokenBalance
              token={token}
              withSymbol
            />
          </div>
          <div className="send-v2__asset-dropdown__name">
            {name}
          </div>
        </div>
      </div>
    )
  }
}
