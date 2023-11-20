import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import Box from '../../ui/box';
import Typography from '../../ui/typography/typography';
import {
  Color,
  TypographyVariant,
  JustifyContent,
  FLEX_DIRECTION,
  AlignItems,
  DISPLAY,
  BLOCK_SIZES,
  FLEX_WRAP,
} from '../../../helpers/constants/design-system';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import {
  getCurrentChainId,
  getIpfsGateway,
  getSelectedAddress,
  getCurrentNetwork,
  getOpenSeaEnabled,
} from '../../../selectors';
import { ASSET_ROUTE } from '../../../helpers/constants/routes';
import { getAssetImageURL } from '../../../helpers/utils/util';
import { getNftImageAlt } from '../../../helpers/utils/nfts';
import { updateNftDropDownState } from '../../../store/actions';
import { usePrevious } from '../../../hooks/usePrevious';
import { getNftsDropdownState } from '../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Icon, IconName } from '../../component-library';
import { NftItem } from '../../multichain/nft-item';

const width =
  getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
    ? BLOCK_SIZES.ONE_THIRD
    : BLOCK_SIZES.ONE_SIXTH;

const PREVIOUSLY_OWNED_KEY = 'previouslyOwned';

export default function NftsItems({
  collections = {},
  previouslyOwnedCollection = {},
}) {
  const dispatch = useDispatch();
  const collectionsKeys = Object.keys(collections);
  const nftsDropdownState = useSelector(getNftsDropdownState);
  const previousCollectionKeys = usePrevious(collectionsKeys);
  const selectedAddress = useSelector(getSelectedAddress);
  const chainId = useSelector(getCurrentChainId);
  const currentChain = useSelector(getCurrentNetwork);
  const t = useI18nContext();
  const ipfsGateway = useSelector(getIpfsGateway);
  const openSeaEnabled = useSelector(getOpenSeaEnabled);

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

  const history = useHistory();

  const renderCollectionImage = (collectionImage, collectionName) => {
    if (collectionImage?.startsWith('ipfs') && !ipfsGateway) {
      return (
        <div className="nfts-items__collection-image-alt">
          {collectionName?.[0]?.toUpperCase() ?? null}
        </div>
      );
    }
    if (!openSeaEnabled && !collectionImage?.startsWith('ipfs')) {
      return (
        <div className="nfts-items__collection-image-alt">
          {collectionName?.[0]?.toUpperCase() ?? null}
        </div>
      );
    }

    if (collectionImage) {
      return (
        <img
          alt={collectionName}
          src={getAssetImageURL(collectionImage, ipfsGateway)}
          className="nfts-items__collection-image"
        />
      );
    }
    return (
      <div className="nfts-items__collection-image-alt">
        {collectionName?.[0]?.toUpperCase() ?? null}
      </div>
    );
  };

  const updateNftDropDownStateKey = (key, isExpanded) => {
    const newCurrentAccountState = {
      ...nftsDropdownState[selectedAddress][chainId],
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

  const renderCollection = ({ nfts, collectionName, collectionImage, key }) => {
    if (!nfts.length) {
      return null;
    }

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
              {renderCollectionImage(collectionImage, collectionName)}
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
              const { image, address, tokenId, name, imageOriginal } = nft;
              const nftImage = getAssetImageURL(
                imageOriginal ?? image,
                ipfsGateway,
              );
              const nftImageAlt = getNftImageAlt(nft);
              const isImageHosted = image?.startsWith('https:');
              const nftImageURL = imageOriginal?.startsWith('ipfs')
                ? nftImage
                : image;
              const nftSrcUrl = imageOriginal ?? image;
              const isIpfsURL = nftSrcUrl?.startsWith('ipfs:');
              const handleImageClick = () =>
                history.push(`${ASSET_ROUTE}/${address}/${tokenId}`);
              return (
                <Box
                  data-testid="nft-wrapper"
                  width={width}
                  key={`nft-${i}`}
                  className="nfts-items__item-wrapper"
                >
                  <NftItem
                    nftImageURL={nftImageURL}
                    alt={nftImageAlt}
                    src={isImageHosted ? image : nftImage}
                    name={name}
                    tokenId={tokenId}
                    networkName={currentChain.nickname}
                    networkSrc={currentChain.rpcPrefs?.imageUrl}
                    onClick={handleImageClick}
                    isIpfsURL={isIpfsURL}
                    clickable
                  />
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
          {renderCollection({
            nfts: previouslyOwnedCollection.nfts,
            collectionName: previouslyOwnedCollection.collectionName,
            collectionImage: previouslyOwnedCollection.nfts[0]?.image,
            isPreviouslyOwnedCollection: true,
            key: PREVIOUSLY_OWNED_KEY,
          })}
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
};
