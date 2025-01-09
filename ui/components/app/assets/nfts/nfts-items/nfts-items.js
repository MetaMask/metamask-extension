import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import Box from '../../../../ui/box';
import Typography from '../../../../ui/typography/typography';
import {
  Color,
  TypographyVariant,
  JustifyContent,
  FLEX_DIRECTION,
  AlignItems,
  DISPLAY,
  BLOCK_SIZES,
  FLEX_WRAP,
} from '../../../../../helpers/constants/design-system';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../../shared/constants/app';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../../../app/scripts/lib/util';
import { getCurrentChainId } from '../../../../../../shared/modules/selectors/networks';
import {
  getIpfsGateway,
  getSelectedInternalAccount,
  getCurrentNetwork,
} from '../../../../../selectors';
import {
  ASSET_ROUTE,
  SEND_ROUTE,
} from '../../../../../helpers/constants/routes';
import { getAssetImageURL } from '../../../../../helpers/utils/util';
import { getNftImageAlt } from '../../../../../helpers/utils/nfts';
import { updateNftDropDownState } from '../../../../../store/actions';
import { usePrevious } from '../../../../../hooks/usePrevious';
import { getNftsDropdownState } from '../../../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Icon, IconName, Text } from '../../../../component-library';
import { NftItem } from '../../../../multichain/nft-item';
import {
  getSendAnalyticProperties,
  updateSendAsset,
} from '../../../../../ducks/send';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { isEqualCaseInsensitive } from '../../../../../../shared/modules/string-utils';
import { CollectionImageComponent } from './collection-image.component';

const width = (isModal) => {
  const env = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  if (isModal) {
    return BLOCK_SIZES.ONE_THIRD;
  }
  if (env === ENVIRONMENT_TYPE_POPUP) {
    return BLOCK_SIZES.ONE_THIRD;
  }
  return BLOCK_SIZES.ONE_SIXTH;
};

const PREVIOUSLY_OWNED_KEY = 'previouslyOwned';

export default function NftsItems({
  collections = {},
  previouslyOwnedCollection = {},
  isModal = false,
  onCloseModal = {},
  showTokenId = false,
  displayPreviouslyOwnedCollection = true,
}) {
  const dispatch = useDispatch();
  const collectionsKeys = Object.keys(collections);
  const nftsDropdownState = useSelector(getNftsDropdownState);
  const previousCollectionKeys = usePrevious(collectionsKeys);
  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const chainId = useSelector(getCurrentChainId);
  const currentChain = useSelector(getCurrentNetwork);
  const t = useI18nContext();
  const ipfsGateway = useSelector(getIpfsGateway);

  const [updatedNfts, setUpdatedNfts] = useState([]);

  const trackEvent = useContext(MetaMetricsContext);
  const sendAnalytics = useSelector(getSendAnalyticProperties);

  useEffect(() => {
    if (
      chainId !== undefined &&
      selectedAddress !== undefined &&
      !isEqual(previousCollectionKeys, collectionsKeys) &&
      (nftsDropdownState?.[selectedAddress]?.[chainId] === undefined ||
        Object.keys(nftsDropdownState?.[selectedAddress]?.[chainId]).length ===
          0)
    ) {
      const initState = {};
      collectionsKeys.forEach((key) => {
        initState[key] = true;
      });

      const newNftDropdownState = {
        ...nftsDropdownState,
        [selectedAddress]: {
          ...nftsDropdownState?.[selectedAddress],
          [chainId]: initState,
        },
      };

      dispatch(updateNftDropDownState(newNftDropdownState));
    }
  }, [
    collectionsKeys,
    previousCollectionKeys,
    nftsDropdownState,
    selectedAddress,
    chainId,
    dispatch,
  ]);

  const getAssetImageUrlAndUpdate = async (image, nft) => {
    const nftImage = await getAssetImageURL(image, ipfsGateway);
    const updatedNFt = {
      ...nft,
      ipfsImageUpdated: nftImage,
    };
    return updatedNFt;
  };

  useEffect(() => {
    const promisesArr = [];
    const modifyItems = async () => {
      for (const key of collectionsKeys) {
        const { nfts } = collections[key];
        for (const singleNft of nfts) {
          const { image, imageOriginal } = singleNft;

          const isImageHosted =
            image?.startsWith('https:') || image?.startsWith('http:');
          if (!isImageHosted) {
            promisesArr.push(
              getAssetImageUrlAndUpdate(imageOriginal ?? image, singleNft),
            );
          }
        }
      }
      const settled = await Promise.all(promisesArr);
      setUpdatedNfts(settled);
    };

    modifyItems();
  }, []);

  const history = useHistory();

  const updateNftDropDownStateKey = (key, isExpanded) => {
    const newCurrentAccountState = {
      ...nftsDropdownState?.[selectedAddress]?.[chainId],
      [key]: !isExpanded,
    };

    const newState = {
      ...nftsDropdownState,
      [selectedAddress]: {
        [chainId]: newCurrentAccountState,
      },
    };

    dispatch(updateNftDropDownState(newState));
  };

  const onSendNft = async (nft) => {
    trackEvent(
      {
        event: MetaMetricsEventName.sendAssetSelected,
        category: MetaMetricsEventCategory.Send,
        properties: {
          is_destination_asset_picker_modal: false,
          is_nft: true,
        },
        sensitiveProperties: {
          ...sendAnalytics,
          new_asset_symbol: nft.name,
          new_asset_address: nft.address,
        },
      },
      { excludeMetaMetricsId: false },
    );
    await dispatch(
      updateSendAsset({
        type: AssetType.NFT,
        details: nft,
        skipComputeEstimatedGasLimit: false,
      }),
    );
    history.push(SEND_ROUTE);
    onCloseModal();
  };

  const renderCollection = ({ nfts, collectionName, collectionImage, key }) => {
    if (!nfts.length) {
      return null;
    }
    const getSource = (isImageHosted, nft) => {
      if (!isImageHosted) {
        const found = updatedNfts.find(
          (elm) =>
            elm.tokenId === nft.tokenId &&
            isEqualCaseInsensitive(elm.address, nft.address),
        );
        if (found) {
          return found.ipfsImageUpdated;
        }
      }
      return nft.image;
    };

    const isExpanded = nftsDropdownState[selectedAddress]?.[chainId]?.[key];
    return (
      <div className="nfts-items__collection" key={`collection-${key}`}>
        <button
          className="nfts-items__collection-wrapper"
          data-testid="collection-expander-button"
          onClick={() => {
            updateNftDropDownStateKey(key, isExpanded);
          }}
        >
          <Box
            marginBottom={2}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
            className="nfts-items__collection-accordion-title"
          >
            <Box
              alignItems={AlignItems.center}
              className="nfts-items__collection-header"
            >
              <CollectionImageComponent
                collectionImage={collectionImage}
                collectionName={collectionName}
              />
              <Typography
                color={Color.textDefault}
                variant={TypographyVariant.H5}
                margin={2}
              >
                {`${collectionName ?? t('unknownCollection')} (${nfts.length})`}
              </Typography>
            </Box>
            <Box alignItems={AlignItems.flexEnd}>
              <Icon
                name={isExpanded ? IconName.ArrowDown : IconName.ArrowRight}
                color={Color.iconDefault}
              />
            </Box>
          </Box>
        </button>

        {isExpanded ? (
          <Box display={DISPLAY.FLEX} flexWrap={FLEX_WRAP.WRAP} gap={4}>
            {nfts.map((nft, i) => {
              const { image, address, tokenId, name, imageOriginal, tokenURI } =
                nft;
              const nftImageAlt = getNftImageAlt(nft);
              const isImageHosted =
                image?.startsWith('https:') || image?.startsWith('http:');

              const source = getSource(isImageHosted, nft);

              const isIpfsURL = (
                imageOriginal ??
                image ??
                tokenURI
              )?.startsWith('ipfs:');
              const handleImageClick = () => {
                if (isModal) {
                  return onSendNft(nft);
                }
                return history.push(
                  `${ASSET_ROUTE}/${currentChain.chainId}/${address}/${tokenId}`,
                );
              };
              return (
                <Box
                  data-testid="nft-wrapper"
                  width={width(isModal)}
                  key={`nft-${i}`}
                  className="nfts-items__item-wrapper"
                >
                  <NftItem
                    alt={nftImageAlt}
                    src={source}
                    name={name}
                    tokenId={tokenId}
                    networkName={currentChain.nickname}
                    networkSrc={currentChain.rpcPrefs?.imageUrl}
                    onClick={handleImageClick}
                    isIpfsURL={isIpfsURL}
                    clickable
                  />
                  {showTokenId ? <Text>{`${t('id')}: ${tokenId}`}</Text> : null}
                </Box>
              );
            })}
          </Box>
        ) : null}
      </div>
    );
  };

  return (
    <div className="nfts-items">
      <Box
        paddingTop={6}
        paddingBottom={6}
        paddingLeft={4}
        paddingRight={4}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <>
          {collectionsKeys.map((key) => {
            const { nfts, collectionName, collectionImage } = collections[key];

            return renderCollection({
              nfts,
              collectionName,
              collectionImage,
              key,
              isPreviouslyOwnedCollection: false,
            });
          })}
          {displayPreviouslyOwnedCollection
            ? renderCollection({
                nfts: previouslyOwnedCollection.nfts,
                collectionName: previouslyOwnedCollection.collectionName,
                collectionImage: previouslyOwnedCollection.nfts[0]?.image,
                isPreviouslyOwnedCollection: true,
                key: PREVIOUSLY_OWNED_KEY,
              })
            : null}
        </>
      </Box>
    </div>
  );
}

NftsItems.propTypes = {
  previouslyOwnedCollection: PropTypes.shape({
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
    collectionName: PropTypes.string,
    collectionImage: PropTypes.string,
  }),
  collections: PropTypes.shape({
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
    collectionImage: PropTypes.string,
    collectionName: PropTypes.string,
  }),
  isModal: PropTypes.bool,
  onCloseModal: PropTypes.func,
  showTokenId: PropTypes.bool,
  displayPreviouslyOwnedCollection: PropTypes.bool,
};
