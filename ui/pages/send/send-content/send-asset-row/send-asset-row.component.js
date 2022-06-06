import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SendRowWrapper from '../send-row-wrapper';
import Identicon from '../../../../components/ui/identicon';
import TokenBalance from '../../../../components/ui/token-balance';
import TokenListDisplay from '../../../../components/app/token-list-display';
import UserPreferencedCurrencyDisplay from '../../../../components/app/user-preferenced-currency-display';
import { ERC20, ERC721, PRIMARY } from '../../../../helpers/constants/common';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { EVENT } from '../../../../../shared/constants/metametrics';
import { ASSET_TYPES } from '../../../../../shared/constants/transaction';

export default class SendAssetRow extends Component {
  static propTypes = {
    tokens: PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string,
        decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        symbol: PropTypes.string,
        image: PropTypes.string,
      }),
    ).isRequired,
    accounts: PropTypes.object.isRequired,
    selectedAddress: PropTypes.string.isRequired,
    sendAsset: PropTypes.object,
    updateSendAsset: PropTypes.func.isRequired,
    nativeCurrency: PropTypes.string,
    nativeCurrencyImage: PropTypes.string,
    collectibles: PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string.isRequired,
        tokenId: PropTypes.string.isRequired,
        name: PropTypes.string,
        description: PropTypes.string,
        image: PropTypes.string,
        standard: PropTypes.string,
        imageThumbnail: PropTypes.string,
        imagePreview: PropTypes.string,
        creator: PropTypes.shape({
          address: PropTypes.string,
          config: PropTypes.string,
          profile_img_url: PropTypes.string,
        }),
      }),
    ),
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  state = {
    isShowingDropdown: false,
    sendableTokens: [],
    sendableCollectibles: [],
  };

  async componentDidMount() {
    const sendableTokens = this.props.tokens.filter((token) => !token.isERC721);
    const sendableCollectibles = this.props.collectibles.filter(
      (collectible) =>
        collectible.isCurrentlyOwned && collectible.standard === ERC721,
    );
    this.setState({ sendableTokens, sendableCollectibles });
  }

  openDropdown = () => this.setState({ isShowingDropdown: true });

  closeDropdown = () => this.setState({ isShowingDropdown: false });

  getAssetSelected = (type, token) => {
    switch (type) {
      case ASSET_TYPES.NATIVE:
        return this.props.nativeCurrency;
      case ASSET_TYPES.TOKEN:
        return ERC20;
      case ASSET_TYPES.COLLECTIBLE:
        return token?.standard;
      default:
        return null;
    }
  };

  selectToken = (type, token) => {
    this.setState(
      {
        isShowingDropdown: false,
      },
      () => {
        this.context.trackEvent({
          category: EVENT.CATEGORIES.TRANSACTIONS,
          event: 'User clicks "Assets" dropdown',
          properties: {
            action: 'Send Screen',
            legacy_event: true,
            assetSelected: this.getAssetSelected(type, token),
          },
        });
        this.props.updateSendAsset({
          type,
          details: type === ASSET_TYPES.NATIVE ? null : token,
        });
      },
    );
  };

  render() {
    const { t } = this.context;

    return (
      <SendRowWrapper label={`${t('asset')}:`}>
        <div className="send-v2__asset-dropdown">
          <div
            className="send-v2__asset-dropdown__input-wrapper"
            onClick={this.openDropdown}
          >
            {this.renderSendAsset()}
          </div>
          {[...this.state.sendableTokens, ...this.state.sendableCollectibles]
            .length > 0
            ? this.renderAssetDropdown()
            : null}
        </div>
      </SendRowWrapper>
    );
  }

  renderSendAsset() {
    const {
      sendAsset: { details, type },
      tokens,
      collectibles,
    } = this.props;

    if (type === ASSET_TYPES.TOKEN) {
      const token = tokens.find(({ address }) =>
        isEqualCaseInsensitive(address, details.address),
      );
      if (token) {
        return this.renderToken(token);
      }
    } else if (type === ASSET_TYPES.COLLECTIBLE) {
      const collectible = collectibles.find(
        ({ address, tokenId }) =>
          isEqualCaseInsensitive(address, details.address) &&
          tokenId === details.tokenId,
      );
      if (collectible) {
        return this.renderCollectible(collectible);
      }
    }
    return this.renderNativeCurrency();
  }

  renderAssetDropdown() {
    return (
      this.state.isShowingDropdown && (
        <div>
          <div
            className="send-v2__asset-dropdown__close-area"
            onClick={this.closeDropdown}
          />
          <div className="send-v2__asset-dropdown__list">
            {this.renderNativeCurrency(true)}
            <TokenListDisplay
              clickHandler={(token) =>
                this.selectToken(ASSET_TYPES.TOKEN, token)
              }
            />

            {this.state.sendableCollectibles.map((collectible) =>
              this.renderCollectible(collectible, true),
            )}
          </div>
        </div>
      )
    );
  }

  renderNativeCurrency(insideDropdown = false) {
    const { t } = this.context;
    const {
      accounts,
      selectedAddress,
      nativeCurrency,
      nativeCurrencyImage,
    } = this.props;

    const { sendableTokens, sendableCollectibles } = this.state;

    const balanceValue = accounts[selectedAddress]
      ? accounts[selectedAddress].balance
      : '';

    const sendableAssets = [...sendableTokens, ...sendableCollectibles];
    return (
      <div
        className={
          sendableAssets.length > 0
            ? 'send-v2__asset-dropdown__asset'
            : 'send-v2__asset-dropdown__single-asset'
        }
        onClick={() => this.selectToken(ASSET_TYPES.NATIVE)}
      >
        <div className="send-v2__asset-dropdown__asset-icon">
          <Identicon
            diameter={36}
            image={nativeCurrencyImage}
            address={nativeCurrency}
          />
        </div>
        <div className="send-v2__asset-dropdown__asset-data">
          <div className="send-v2__asset-dropdown__symbol">
            {nativeCurrency}
          </div>
          <div className="send-v2__asset-dropdown__name">
            <span className="send-v2__asset-dropdown__name__label">
              {`${t('balance')}:`}
            </span>
            <UserPreferencedCurrencyDisplay
              value={balanceValue}
              type={PRIMARY}
            />
          </div>
        </div>
        {!insideDropdown && sendableAssets.length > 0 && (
          <i className="fa fa-caret-down fa-lg send-v2__asset-dropdown__caret" />
        )}
      </div>
    );
  }

  renderToken(token, insideDropdown = false) {
    const { address, symbol, image } = token;
    const { t } = this.context;

    return (
      <div
        key={address}
        className="send-v2__asset-dropdown__asset"
        onClick={() => this.selectToken(ASSET_TYPES.TOKEN, token)}
      >
        <div className="send-v2__asset-dropdown__asset-icon">
          <Identicon address={address} diameter={36} image={image} />
        </div>
        <div className="send-v2__asset-dropdown__asset-data">
          <div className="send-v2__asset-dropdown__symbol">{symbol}</div>
          <div className="send-v2__asset-dropdown__name">
            <span className="send-v2__asset-dropdown__name__label">
              {`${t('balance')}:`}
            </span>
            <TokenBalance token={token} />
          </div>
        </div>
        {!insideDropdown && (
          <i className="fa fa-caret-down fa-lg send-v2__asset-dropdown__caret" />
        )}
      </div>
    );
  }

  renderCollectible(collectible, insideDropdown = false) {
    const { address, name, image, tokenId } = collectible;
    const { t } = this.context;

    return (
      <div
        key={address}
        className="send-v2__asset-dropdown__asset"
        onClick={() => this.selectToken(ASSET_TYPES.COLLECTIBLE, collectible)}
      >
        <div className="send-v2__asset-dropdown__asset-icon">
          <Identicon address={address} diameter={36} image={image} />
        </div>
        <div className="send-v2__asset-dropdown__asset-data">
          <div className="send-v2__asset-dropdown__symbol">{name}</div>
          <div className="send-v2__asset-dropdown__name">
            <span className="send-v2__asset-dropdown__name__label">
              {`${t('tokenId')}:`}
            </span>
            {tokenId}
          </div>
        </div>
        {!insideDropdown && (
          <i className="fa fa-caret-down fa-lg send-v2__asset-dropdown__caret" />
        )}
      </div>
    );
  }
}
