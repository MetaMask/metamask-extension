import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { chain } from 'lodash';
import SendRowWrapper from '../send-row-wrapper';
import Identicon from '../../../../../components/ui/identicon';
import TokenBalance from '../../../../../components/ui/token-balance';
import TokenListDisplay from '../../../../../components/app/token-list-display';
import UserPreferencedCurrencyDisplay from '../../../../../components/app/user-preferenced-currency-display';
import { PRIMARY } from '../../../../../helpers/constants/common';
import { isEqualCaseInsensitive } from '../../../../../../shared/modules/string-utils';
import { MetaMetricsEventCategory } from '../../../../../../shared/constants/metametrics';
import {
  AssetType,
  TokenStandard,
} from '../../../../../../shared/constants/transaction';
import { Text } from '../../../../../components/component-library';
import { TextVariant } from '../../../../../helpers/constants/design-system';

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
    nfts: PropTypes.arrayOf(
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
    collections: PropTypes.arrayOf(
      PropTypes.shape({
        address: PropTypes.string.isRequired,
        name: PropTypes.string,
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
    sendableNfts: [],
  };

  async componentDidMount() {
    const sendableTokens = this.props.tokens.filter((token) => !token.isERC721);
    const sendableNftsNotSorted = this.props.nfts.filter(
      (nft) =>
        nft.isCurrentlyOwned &&
        (nft.standard === TokenStandard.ERC721 ||
          nft.standard === TokenStandard.ERC1155),
    );

    // Group and sort the sendableNfts Array
    const sendableNfts = chain(sendableNftsNotSorted)
      .groupBy('address')
      .mapValues((group) => {
        return group.sort((a, b) => a.tokenId - b.tokenId);
      })
      .values()
      .flatten()
      .value();

    this.setState({ sendableTokens, sendableNfts });
  }

  openDropdown = () => this.setState({ isShowingDropdown: true });

  closeDropdown = () => this.setState({ isShowingDropdown: false });

  getAssetSelected = (type, token) => {
    switch (type) {
      case AssetType.native:
        return this.props.nativeCurrency;
      case AssetType.token:
        return TokenStandard.ERC20;
      case AssetType.NFT:
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
          category: MetaMetricsEventCategory.Transactions,
          event: 'User clicks "Assets" dropdown',
          properties: {
            action: 'Send Screen',
            legacy_event: true,
            assetSelected: this.getAssetSelected(type, token),
          },
        });
        this.props.updateSendAsset({
          type,
          details: type === AssetType.native ? null : token,
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
          {[...this.state.sendableTokens, ...this.state.sendableNfts].length > 0
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
      nfts,
    } = this.props;

    if (type === AssetType.token) {
      const token = tokens.find(({ address }) =>
        isEqualCaseInsensitive(address, details.address),
      );
      if (token) {
        return this.renderToken(token);
      }
      return this.renderToken(details);
    } else if (type === AssetType.NFT) {
      const nft = nfts.find(
        ({ address, tokenId }) =>
          isEqualCaseInsensitive(address, details.address) &&
          tokenId === details.tokenId,
      );
      if (nft || details) {
        return this.renderNft(nft ?? details);
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
              clickHandler={(token) => this.selectToken(AssetType.token, token)}
            />

            {this.state.sendableNfts.map((nft) => this.renderNft(nft, true))}
          </div>
        </div>
      )
    );
  }

  renderNativeCurrency(insideDropdown = false) {
    const { t } = this.context;
    const { accounts, selectedAddress, nativeCurrency, nativeCurrencyImage } =
      this.props;
    const { sendableTokens, sendableNfts } = this.state;

    const balanceValue = accounts[selectedAddress]
      ? accounts[selectedAddress].balance
      : '';

    const sendableAssets = [...sendableTokens, ...sendableNfts];
    return (
      <div
        className={
          sendableAssets.length > 0
            ? 'send-v2__asset-dropdown__asset'
            : 'send-v2__asset-dropdown__single-asset'
        }
        onClick={() => this.selectToken(AssetType.native)}
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
        onClick={() => this.selectToken(AssetType.token, token)}
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

  renderNft(nft, insideDropdown = false) {
    const { address, name, image, tokenId } = nft;
    const { t } = this.context;
    const nftCollection = this.props.collections.find(
      (collection) => collection.address === address,
    );

    const label = nftCollection?.name || name;

    return (
      <div
        key={address}
        className="send-v2__asset-dropdown__asset"
        onClick={() => this.selectToken(AssetType.NFT, nft)}
      >
        <div className="send-v2__asset-dropdown__asset-icon">
          <Identicon address={address} diameter={36} image={image} />
        </div>
        <div className="send-v2__asset-dropdown__asset-data">
          <div className="send-v2__asset-dropdown__symbol" title={label}>
            {label}
          </div>
          <Text variant={TextVariant.bodyXs} ellipsis title={tokenId}>
            {`${t('tokenId')}: ${tokenId}`}
          </Text>
        </div>
        {!insideDropdown && (
          <i className="fa fa-caret-down fa-lg send-v2__asset-dropdown__caret" />
        )}
      </div>
    );
  }
}
