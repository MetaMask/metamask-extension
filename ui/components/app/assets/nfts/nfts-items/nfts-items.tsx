import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import { Hex } from '@metamask/utils';
import {
  JustifyContent,
  AlignItems,
  IconColor,
  Display,
  FlexWrap,
  BlockSize,
  FlexDirection,
  TextColor,
  TextVariant,
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
import { Box, Icon, IconName, Text } from '../../../../component-library';
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
import {
  Collection,
  NFT,
} from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import { PreviouslyOwnedCollections } from '../../../../multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-nft-tab';
import { CollectionImageComponent } from './collection-image.component';

type NftsItemsProps = {
  collections: Record<Hex, Collection>;
  previouslyOwnedCollection: PreviouslyOwnedCollections;
  isModal?: boolean;
  onCloseModal?: () => void;
  showTokenId?: boolean;
  displayPreviouslyOwnedCollection?: boolean;
};

const width = (isModal: boolean) => {
  const env = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  if (isModal) {
    return BlockSize.OneThird;
  }
  if (env === Boolean(ENVIRONMENT_TYPE_POPUP)) {
    return BlockSize.OneThird;
  }
  return BlockSize.OneSixth;
};

const PREVIOUSLY_OWNED_KEY = 'previouslyOwned';

export default function NftsItems({
  collections,
  previouslyOwnedCollection,
  isModal = false,
  onCloseModal,
  showTokenId = false,
  displayPreviouslyOwnedCollection = true,
}: NftsItemsProps) {
  const dispatch = useDispatch();
  const collectionsKeys = Object.keys(collections);
  const nftsDropdownState = useSelector(getNftsDropdownState);
  const previousCollectionKeys = usePrevious(collectionsKeys);
  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const chainId = useSelector(getCurrentChainId);
  const currentChain = useSelector(getCurrentNetwork) as {
    chainId: Hex;
    nickname: string;
    rpcPrefs?: { imageUrl: string };
  };
  const t = useI18nContext();
  const ipfsGateway = useSelector(getIpfsGateway);

  const [updatedNfts, setUpdatedNfts] = useState<NFT[]>([]);

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
      const initState: Record<string, unknown> = {};
      collectionsKeys.forEach((key: string) => {
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

  const getAssetImageUrlAndUpdate = async (image: string, nft: NFT) => {
    const nftImage = await getAssetImageURL(image, ipfsGateway);
    const updatedNFt = {
      ...nft,
      ipfsImageUpdated: nftImage,
    };
    return updatedNFt;
  };

  useEffect(() => {
    const promisesArr: Promise<NFT>[] = [];
    const modifyItems = async () => {
      for (const key of collectionsKeys) {
        // @ts-expect-error: We want to index the collections keys by hex
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

  const updateNftDropDownStateKey = (key: Hex, isExpanded: boolean) => {
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

  const onSendNft = async (nft: NFT) => {
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
    onCloseModal && onCloseModal();
  };

  const renderCollection = ({
    nfts,
    collectionName,
    collectionImage,
    key,
  }: Collection & { key: Hex }) => {
    if (!nfts.length) {
      return null;
    }
    const getSource = (isImageHosted: boolean, nft: NFT) => {
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
            updateNftDropDownStateKey(key as Hex, isExpanded);
          }}
        >
          <Box
            marginBottom={2}
            display={Display.Flex}
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
              <Text
                color={TextColor.textDefault}
                variant={TextVariant.headingLg}
                margin={2}
              >
                {`${collectionName ?? t('unknownCollection')} (${nfts.length})`}
              </Text>
            </Box>
            <Box alignItems={AlignItems.flexEnd}>
              <Icon
                name={isExpanded ? IconName.ArrowDown : IconName.ArrowRight}
                color={IconColor.iconDefault}
              />
            </Box>
          </Box>
        </button>

        {isExpanded ? (
          <Box display={Display.Flex} flexWrap={FlexWrap.Wrap} gap={4}>
            {nfts.map((nft, i) => {
              const { image, address, tokenId, imageOriginal, tokenURI } = nft;
              const nftImageAlt = getNftImageAlt(nft);
              const isImageHosted =
                image?.startsWith('https:') || image?.startsWith('http:');

              const source = isImageHosted ? getSource(isImageHosted, nft) : '';

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
        flexDirection={FlexDirection.Column}
      >
        <>
          {collectionsKeys.map((key: Hex) => {
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
