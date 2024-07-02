import React, { useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import { getTokenTrackerLink, getAccountLink } from '@metamask/etherscan-link';
import {
  TextColor,
  IconColor,
  TextVariant,
  FontWeight,
  JustifyContent,
  Display,
  FlexWrap,
  FontStyle,
  TextAlign,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  formatDateWithSuffix,
  getAssetImageURL,
  shortenAddress,
} from '../../../helpers/utils/util';
import { getNftImageAlt } from '../../../helpers/utils/nfts';
import {
  getCurrentChainId,
  getCurrentCurrency,
  getCurrentNetwork,
  getIpfsGateway,
} from '../../../selectors';
import { DEFAULT_ROUTE, SEND_ROUTE } from '../../../helpers/constants/routes';
import {
  checkAndUpdateSingleNftOwnershipStatus,
  removeAndIgnoreNft,
  setRemoveNftMessage,
  setNewNftAddedMessage,
} from '../../../store/actions';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import NftOptions from '../nft-options/nft-options';
import { startNewDraftTransaction } from '../../../ducks/send';
import InfoTooltip from '../../ui/info-tooltip';
import { usePrevious } from '../../../hooks/usePrevious';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import {
  AssetType,
  TokenStandard,
} from '../../../../shared/constants/transaction';
import {
  ButtonIcon,
  IconName,
  Text,
  Box,
  ButtonIconSize,
  IconSize,
  ButtonPrimarySize,
  ButtonPrimary,
  Icon,
} from '../../component-library';
import { NftItem } from '../../multichain/nft-item';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { Content, Footer, Page } from '../../multichain/pages/page';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { getPricePrecision } from '../../../pages/asset/util';
import { SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/swaps';
import NftDetailInformationRow from './nft-detail-information-row';
import NftDetailInformationFrame from './nft-detail-information-frame';
import NftDetailDescription from './nft-detail-description';

export default function NftDetails({ nft }) {
  const {
    image,
    imageOriginal,
    name,
    description,
    address,
    tokenId,
    standard,
    isCurrentlyOwned,
    lastSale,
    collection,
    rarityRank,
    topBid,
    attributes,
  } = nft;

  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const ipfsGateway = useSelector(getIpfsGateway);
  const currentNetwork = useSelector(getCurrentChainId);
  const currentChain = useSelector(getCurrentNetwork);
  const trackEvent = useContext(MetaMetricsContext);
  const currency = useSelector(getCurrentCurrency);

  const [addressCopied, handleAddressCopy] = useCopyToClipboard();

  const nftImageAlt = getNftImageAlt(nft);
  const nftSrcUrl = imageOriginal ?? image;
  const nftImageURL = getAssetImageURL(imageOriginal ?? image, ipfsGateway);
  const isIpfsURL = nftSrcUrl?.startsWith('ipfs:');
  const isImageHosted = image?.startsWith('https:');

  const hasFloorAskPrice = Boolean(collection?.floorAsk?.price?.amount?.usd);
  const hasLastSalePrice = Boolean(lastSale?.price?.amount?.usd);

  const getFloorAskSource = () => {
    if (
      hasFloorAskPrice &&
      (Boolean(collection?.floorAsk?.source?.url) ||
        Boolean(collection?.floorAsk?.sourceDomain))
    ) {
      return (
        collection?.floorAsk?.source?.url || collection?.floorAsk?.sourceDomain
      );
    }
    return undefined;
  };

  const getCurrentHighestBidValue = () => {
    if (topBid?.price && collection?.topBid?.price) {
      // return the max between collection top Bid and token topBid
      const topBidValue = Math.max(
        topBid?.price?.amount?.native,
        collection?.topBid?.price?.amount?.native,
      );
      const currentChainSymbol = currentChain.ticker;
      return `${topBidValue}${currentChainSymbol}`;
    }
    // return the one that is available
    const topBidValue =
      topBid?.price?.amount?.native ||
      collection?.topBid?.price?.amount?.native;
    if (!topBidValue) {
      return undefined;
    }
    const currentChainSymbol = currentChain.ticker;
    return `${topBidValue}${currentChainSymbol}`;
  };

  const getTopBidSourceDomain = () => {
    return (
      topBid?.source?.url ||
      (collection?.topBid?.sourceDomain
        ? `https://${collection.topBid?.sourceDomain}`
        : undefined)
    );
  };

  const { chainId } = currentChain;
  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.NftDetailsOpened,
      category: MetaMetricsEventCategory.Tokens,
      properties: {
        chain_id: chainId,
      },
    });
  }, [trackEvent, chainId]);

  const onRemove = async () => {
    let isSuccessfulEvent = false;
    try {
      await dispatch(removeAndIgnoreNft(address, tokenId));
      dispatch(setNewNftAddedMessage(''));
      dispatch(setRemoveNftMessage('success'));
      isSuccessfulEvent = true;
    } catch (err) {
      dispatch(setNewNftAddedMessage(''));
      dispatch(setRemoveNftMessage('error'));
    } finally {
      // track event
      trackEvent({
        event: MetaMetricsEventName.NFTRemoved,
        category: 'Wallet',
        properties: {
          token_contract_address: address,
          tokenId: tokenId.toString(),
          asset_type: AssetType.NFT,
          token_standard: standard,
          chain_id: currentNetwork,
          isSuccessful: isSuccessfulEvent,
        },
      });
      history.push(DEFAULT_ROUTE);
    }
  };

  const prevNft = usePrevious(nft);
  useEffect(() => {
    if (!isEqual(prevNft, nft)) {
      checkAndUpdateSingleNftOwnershipStatus(nft);
    }
  }, [nft, prevNft]);

  const getOpenSeaLink = () => {
    switch (currentNetwork) {
      case CHAIN_IDS.MAINNET:
        return `https://opensea.io/assets/ethereum/${address}/${tokenId}`;
      case CHAIN_IDS.POLYGON:
        return `https://opensea.io/assets/matic/${address}/${tokenId}`;
      case CHAIN_IDS.GOERLI:
        return `https://testnets.opensea.io/assets/goerli/${address}/${tokenId}`;
      case CHAIN_IDS.SEPOLIA:
        return `https://testnets.opensea.io/assets/sepolia/${address}/${tokenId}`;
      default:
        return null;
    }
  };

  const openSeaLink = getOpenSeaLink();
  const sendDisabled =
    standard !== TokenStandard.ERC721 && standard !== TokenStandard.ERC1155;

  const onSend = async () => {
    await dispatch(
      startNewDraftTransaction({
        type: AssetType.NFT,
        details: nft,
      }),
    );
    // We only allow sending one NFT at a time
    history.push(SEND_ROUTE);
  };

  const getDateCreatedTimestamp = (dateString) => {
    const date = new Date(dateString);
    return Math.floor(date.getTime() / 1000);
  };

  const hasPriceSection = getCurrentHighestBidValue() || lastSale?.timestamp;
  const hasCollectionSection =
    collection?.name || collection?.tokenCount || collection?.creator;
  const hasAttributesSection = attributes && attributes?.length !== 0;

  const blockExplorerTokenLink = (tokenAddress) => {
    return getTokenTrackerLink(
      tokenAddress,
      chainId,
      null, // no networkId
      null, // no holderAddress
      {
        blockExplorerUrl:
          SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[chainId] ?? null,
      },
    );
  };

  return (
    <Page>
      <Content className="nft-details__content">
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
        >
          <ButtonIcon
            color={IconColor.iconAlternative}
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={() => history.push(DEFAULT_ROUTE)}
            data-testid="nft__back"
          />
          <NftOptions
            onViewOnOpensea={
              openSeaLink
                ? () => global.platform.openTab({ url: openSeaLink })
                : null
            }
            onRemove={onRemove}
          />
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          marginBottom={8}
          marginTop={1}
        >
          <Box className="nft-details__nft-item">
            <NftItem
              nftImageURL={nftImageURL}
              src={isImageHosted ? image : nftImageURL}
              alt={image ? nftImageAlt : ''}
              name={name}
              tokenId={tokenId}
              networkName={currentChain.nickname}
              networkSrc={currentChain.rpcPrefs?.imageUrl}
              isIpfsURL={isIpfsURL}
              clickable
            />
          </Box>
        </Box>
        <Box>
          {name || collection.name ? (
            <Box display={Display.Flex} alignItems={AlignItems.center}>
              <Text
                variant={TextVariant.headingMd}
                fontWeight={FontWeight.Bold}
                color={TextColor.textDefault}
                fontStyle={FontStyle.Normal}
                style={{ fontSize: '24px' }}
                data-testid="nft-details__name"
              >
                {name || collection.name}
              </Text>
              {collection?.openseaVerificationStatus === 'verified' ? (
                <Icon
                  marginLeft={1}
                  name={IconName.SecurityTick}
                  color={IconColor.primaryDefault}
                  width="20"
                  height="20"
                />
              ) : null}
            </Box>
          ) : null}

          <NftDetailDescription marginTop={2} value={description} />

          <Box
            marginTop={4}
            marginBottom={4}
            display={Display.Flex}
            gap={4}
            flexWrap={FlexWrap.Wrap}
          >
            {hasLastSalePrice || hasFloorAskPrice ? (
              <>
                <NftDetailInformationFrame
                  frameClassname="nft-details__nft-frame"
                  title={t('boughtFor')}
                  frameTextTitleProps={{
                    textAlign: TextAlign.Center,
                    color: TextColor.textAlternative,
                    variant: TextVariant.bodyMdMedium,
                  }}
                  frameTextTitleStyle={{
                    fontSize: '10px',
                    lineHeight: '16px',
                  }}
                  value={
                    hasLastSalePrice
                      ? formatCurrency(
                          `${lastSale?.price?.amount?.usd}`,
                          currency,
                          getPricePrecision(lastSale?.price?.amount?.usd),
                        )
                      : t('dataUnavailable')
                  }
                  frameTextValueProps={{
                    color: hasLastSalePrice
                      ? TextColor.textDefault
                      : TextColor.textAlternative,
                    variant: hasLastSalePrice
                      ? TextVariant.headingSm
                      : TextColor.bodyMdMedium,
                    textAlign:
                      hasLastSalePrice && lastSale?.orderSource
                        ? undefined
                        : TextAlign.Center,
                  }}
                  frameTextValueStyle={{
                    fontSize: hasLastSalePrice ? '16px' : '10px',
                    lineHeight: hasLastSalePrice ? '24px' : '16px',
                  }}
                  icon={
                    lastSale?.orderSource ? (
                      <ButtonIcon
                        size={IconSize.Sm}
                        padding={2}
                        color={IconColor.iconMuted}
                        onClick={() => {
                          global.platform.openTab({
                            url: lastSale?.orderSource,
                          });
                        }}
                        iconName={IconName.Export}
                      />
                    ) : undefined
                  }
                />
                <NftDetailInformationFrame
                  frameClassname="nft-details__nft-frame"
                  title={t('highestFloorPrice')}
                  frameTextTitleProps={{
                    textAlign: TextAlign.Center,
                    color: TextColor.textAlternative,
                    variant: TextVariant.bodyMdMedium,
                  }}
                  frameTextTitleStyle={{
                    fontSize: '10px',
                    lineHeight: '16px',
                  }}
                  value={
                    hasFloorAskPrice
                      ? formatCurrency(
                          `${collection?.floorAsk?.price?.amount?.usd}`,
                          currency,
                          getPricePrecision(
                            collection?.floorAsk?.price?.amount?.usd,
                          ),
                        )
                      : t('priceUnavailable')
                  }
                  frameTextValueProps={{
                    color: hasFloorAskPrice
                      ? TextColor.textDefault
                      : TextColor.textAlternative,
                    variant: hasFloorAskPrice
                      ? TextVariant.headingSm
                      : TextVariant.bodyMdMedium,
                    textAlign:
                      hasFloorAskPrice && getFloorAskSource()
                        ? undefined
                        : TextAlign.Center,
                  }}
                  frameTextValueStyle={{
                    fontSize: hasFloorAskPrice ? '16px' : '10px',
                    lineHeight: hasFloorAskPrice ? '24px' : '16px',
                  }}
                  icon={
                    getFloorAskSource() ? (
                      <ButtonIcon
                        size={IconSize.Sm}
                        padding={2}
                        color={IconColor.iconMuted}
                        onClick={() => {
                          global.platform.openTab({
                            url: getFloorAskSource(),
                          });
                        }}
                        iconName={IconName.Export}
                      />
                    ) : undefined
                  }
                />
              </>
            ) : null}

            {rarityRank ? (
              <NftDetailInformationFrame
                frameClassname="nft-details__nft-frame"
                title={t('rank')}
                frameTextTitleProps={{
                  textAlign: TextAlign.Center,
                  color: TextColor.textAlternative,
                  variant: TextVariant.bodyMdMedium,
                }}
                frameTextTitleStyle={{
                  fontSize: '10px',
                  lineHeight: '16px',
                }}
                value={`#${rarityRank}`}
                frameTextValueProps={{
                  color: TextColor.textDefault,
                  variant: TextVariant.headingSm,
                  textAlign: TextAlign.Center,
                }}
                frameTextValueStyle={{
                  fontSize: '16px',
                  lineHeight: '24px',
                }}
              />
            ) : null}

            <NftDetailInformationFrame
              frameClassname="nft-details__nft-frame"
              title={t('contractAddress')}
              frameTextTitleProps={{
                textAlign: TextAlign.Center,
                color: TextColor.textAlternative,
                variant: TextVariant.bodyMdMedium,
              }}
              frameTextTitleStyle={{
                fontSize: '10px',
                lineHeight: '16px',
              }}
              buttonAddressValue={
                <button
                  className="nft-details__addressButton"
                  onClick={() => {
                    global.platform.openTab({
                      url: blockExplorerTokenLink(address),
                    });
                  }}
                >
                  <Text
                    color={TextColor.primaryDefault}
                    fontStyle={FontStyle.Normal}
                    variant={TextVariant.bodySmMedium}
                  >
                    {shortenAddress(address)}
                  </Text>
                </button>
              }
              icon={
                <ButtonIcon
                  ariaLabel="copy"
                  size={IconSize.Sm}
                  color={IconColor.primaryDefault}
                  padding={1}
                  data-testid="nft-address-copy"
                  onClick={() => {
                    handleAddressCopy(address);
                  }}
                  iconName={
                    addressCopied ? IconName.CopySuccess : IconName.Copy
                  }
                />
              }
            />
          </Box>
          <NftDetailInformationRow title={t('tokenId')} value={tokenId} />
          <NftDetailInformationRow
            title={t('tokenSymbol')}
            value={collection?.symbol}
          />
          <NftDetailInformationRow
            title={t('numberOfTokens')}
            value={collection?.tokenCount}
          />
          <NftDetailInformationRow
            title={t('tokenStandard')}
            value={standard}
          />
          <NftDetailInformationRow
            title={t('dateCreated')}
            value={
              collection?.contractDeployedAt
                ? formatDateWithSuffix(
                    getDateCreatedTimestamp(collection?.contractDeployedAt),
                  )
                : undefined
            }
          />
          {hasPriceSection ? (
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.spaceBetween}
              marginTop={6}
            >
              <Text
                color={TextColor.textDefault}
                variant={TextVariant.headingMd}
              >
                {t('price')}
              </Text>
            </Box>
          ) : null}
          <NftDetailInformationRow
            title={t('lastSold')}
            value={
              lastSale?.timestamp
                ? formatDateWithSuffix(lastSale?.timestamp)
                : undefined
            }
            icon={
              lastSale?.orderSource ? (
                <ButtonIcon
                  size={IconSize.Sm}
                  color={IconColor.iconMuted}
                  onClick={() => {
                    global.platform.openTab({
                      url: lastSale?.orderSource,
                    });
                  }}
                  iconName={IconName.Export}
                  justifyContent={JustifyContent.flexEnd}
                />
              ) : undefined
            }
          />
          <NftDetailInformationRow
            title={t('highestCurrentBid')}
            value={getCurrentHighestBidValue()}
            icon={
              getTopBidSourceDomain() ? (
                <ButtonIcon
                  size={IconSize.Sm}
                  color={IconColor.iconMuted}
                  onClick={() => {
                    global.platform.openTab({
                      url: getTopBidSourceDomain(),
                    });
                  }}
                  iconName={IconName.Export}
                  justifyContent={JustifyContent.flexEnd}
                />
              ) : undefined
            }
          />
          {hasCollectionSection ? (
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.spaceBetween}
              marginTop={6}
            >
              <Text
                color={TextColor.textDefault}
                variant={TextVariant.headingMd}
              >
                {t('notificationItemCollection')}
              </Text>
            </Box>
          ) : null}
          <NftDetailInformationRow
            title={t('collectionName')}
            value={collection?.name}
          />
          <NftDetailInformationRow
            title={t('tokensInCollection')}
            value={collection?.tokenCount}
          />
          <NftDetailInformationRow
            title={t('creatorAddress')}
            buttonAddressValue={
              collection?.creator ? (
                <button
                  className="nft-details__addressButton"
                  onClick={() => {
                    global.platform.openTab({
                      url: getAccountLink(collection?.creator, chainId),
                    });
                  }}
                >
                  <Text
                    color={TextColor.primaryDefault}
                    fontStyle={FontStyle.Normal}
                    variant={TextVariant.bodySmMedium}
                  >
                    {shortenAddress(collection?.creator)}
                  </Text>
                </button>
              ) : null
            }
            valueColor={TextColor.primaryDefault}
            icon={
              <ButtonIcon
                ariaLabel="copy"
                size={IconSize.Sm}
                color={IconColor.primaryDefault}
                data-testid="nft-address-copy"
                onClick={() => {
                  handleAddressCopy(collection?.creator);
                }}
                iconName={addressCopied ? IconName.CopySuccess : IconName.Copy}
                justifyContent={JustifyContent.flexEnd}
              />
            }
          />
          {hasAttributesSection ? (
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.spaceBetween}
              marginTop={6}
            >
              <Text
                color={TextColor.textDefault}
                variant={TextVariant.headingMd}
              >
                {t('attributes')}
              </Text>
            </Box>
          ) : null}
          <Box
            marginTop={4}
            display={Display.Flex}
            gap={2}
            flexWrap={FlexWrap.Wrap}
          >
            {' '}
            {attributes?.map((elm, idx) => {
              const { key, value } = elm;
              return (
                <NftDetailInformationFrame
                  key={`${key}-${value}-${idx}`}
                  frameClassname="nft-details__nft-attribute-frame"
                  title={key}
                  frameTextTitleProps={{
                    color: TextColor.textAlternative,
                    variant: TextVariant.bodyMdMedium,
                  }}
                  frameTextTitleStyle={{
                    fontSize: '14px',
                    lineHeight: '22px',
                  }}
                  value={value}
                  frameTextValueProps={{
                    color: TextColor.textDefault,
                    variant: TextVariant.bodyMd,
                  }}
                  frameTextValueStyle={{
                    fontSize: '14px',
                  }}
                />
              );
            })}
          </Box>
          <Box marginTop={4}>
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodySm}
              as="h6"
            >
              {t('nftDisclaimer')}
            </Text>
          </Box>
        </Box>
      </Content>
      {isCurrentlyOwned === true ? (
        <Footer>
          <ButtonPrimary
            onClick={onSend}
            disabled={sendDisabled}
            size={ButtonPrimarySize.Lg}
            block
            data-testid="nft-send-button"
          >
            {t('send')}
          </ButtonPrimary>
          {sendDisabled ? (
            <InfoTooltip position="top" contentText={t('sendingDisabled')} />
          ) : null}
        </Footer>
      ) : null}
    </Page>
  );
}

NftDetails.propTypes = {
  nft: PropTypes.shape({
    address: PropTypes.string.isRequired,
    tokenId: PropTypes.string.isRequired,
    isCurrentlyOwned: PropTypes.bool,
    name: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    standard: PropTypes.string,
    imageThumbnail: PropTypes.string,
    imagePreview: PropTypes.string,
    imageOriginal: PropTypes.string,
    rarityRank: PropTypes.string,

    creator: PropTypes.shape({
      address: PropTypes.string,
      config: PropTypes.string,
      profile_img_url: PropTypes.string,
    }),
    attributes: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        value: PropTypes.string,
      }),
    ),
    lastSale: PropTypes.shape({
      timestamp: PropTypes.string,
      orderSource: PropTypes.string,
      price: PropTypes.shape({
        amount: PropTypes.shape({
          native: PropTypes.string,
          decimal: PropTypes.string,
          usd: PropTypes.string,
        }),
        currency: PropTypes.shape({
          symbol: PropTypes.string,
        }),
      }),
    }),
    topBid: PropTypes.shape({
      source: PropTypes.shape({
        id: PropTypes.string,
        domain: PropTypes.string,
        name: PropTypes.string,
        icon: PropTypes.string,
        url: PropTypes.string,
      }),
      price: PropTypes.shape({
        amount: PropTypes.shape({
          native: PropTypes.string,
          decimal: PropTypes.string,
          usd: PropTypes.string,
        }),
        currency: PropTypes.shape({
          symbol: PropTypes.string,
        }),
      }),
    }),
    collection: PropTypes.shape({
      openseaVerificationStatus: PropTypes.string,
      tokenCount: PropTypes.string,
      name: PropTypes.string,
      ownerCount: PropTypes.string,
      creator: PropTypes.string,
      symbol: PropTypes.string,
      contractDeployedAt: PropTypes.string,
      floorAsk: PropTypes.shape({
        sourceDomain: PropTypes.string,
        source: PropTypes.shape({
          id: PropTypes.string,
          domain: PropTypes.string,
          name: PropTypes.string,
          icon: PropTypes.string,
          url: PropTypes.string,
        }),
        price: PropTypes.shape({
          amount: PropTypes.shape({
            native: PropTypes.string,
            decimal: PropTypes.string,
            usd: PropTypes.string,
          }),
          currency: PropTypes.shape({
            symbol: PropTypes.string,
          }),
        }),
      }),
      topBid: PropTypes.shape({
        sourceDomain: PropTypes.string,
        price: PropTypes.shape({
          amount: PropTypes.shape({
            native: PropTypes.string,
            decimal: PropTypes.string,
            usd: PropTypes.string,
          }),
          currency: PropTypes.shape({
            symbol: PropTypes.string,
          }),
        }),
      }),
    }),
  }),
};
