import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import Box from '../../ui/box';
import Typography from '../../ui/typography/typography';
import Card from '../../ui/card';
import {
  COLORS,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  FLEX_DIRECTION,
  ALIGN_ITEMS,
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
} from '../../../selectors';
import { ASSET_ROUTE } from '../../../helpers/constants/routes';
import { getAssetImageURL } from '../../../helpers/utils/util';
import { updateNftDropDownState } from '../../../store/actions';
import { usePrevious } from '../../../hooks/usePrevious';
import { getNftsDropdownState } from '../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../hooks/useI18nContext';
import NftDefaultImage from '../nft-default-image';

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
  const t = useI18nContext();

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

  const ipfsGateway = useSelector(getIpfsGateway);
  const history = useHistory();

  const renderCollectionImage = (
    isPreviouslyOwnedCollection,
    collectionImage,
    collectionName,
  ) => {
    if (isPreviouslyOwnedCollection) {
      return null;
    }
    if (collectionImage) {
      return (
        <img src={collectionImage} className="nfts-items__collection-image" />
      );
    }
    return (
      <div className="nfts-items__collection-image-alt">
        {collectionName?.[0]?.toUpperCase() ?? null}
      </div>
    );
  };

  const updateNftDropDownStateKey = (key, isExpanded) => {
    const currentAccountNftDropdownState =
      nftsDropdownState[selectedAddress][chainId];

    const newCurrentAccountState = {
      ...currentAccountNftDropdownState,
      [key]: !isExpanded,
    };

    nftsDropdownState[selectedAddress][chainId] = newCurrentAccountState;

    dispatch(updateNftDropDownState(nftsDropdownState));
  };

  const renderCollection = ({
    nfts,
    collectionName,
    collectionImage,
    key,
    isPreviouslyOwnedCollection,
  }) => {
    if (!nfts.length) {
      return null;
    }

    const isExpanded = nftsDropdownState[selectedAddress]?.[chainId]?.[key];
    return (
      <div className="nfts-items__collection" key={`collection-${key}`}>
        <button
          onClick={() => {
            updateNftDropDownStateKey(key, isExpanded);
          }}
          className="nfts-items__collection-wrapper"
        >
          <Box
            marginBottom={2}
            display={DISPLAY.FLEX}
            alignItems={ALIGN_ITEMS.CENTER}
            justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
            className="nfts-items__collection-accordion-title"
          >
            <Box
              alignItems={ALIGN_ITEMS.CENTER}
              className="nfts-items__collection-header"
            >
              {renderCollectionImage(
                isPreviouslyOwnedCollection,
                collectionImage,
                collectionName,
              )}
              <Typography
                color={COLORS.TEXT_DEFAULT}
                variant={TYPOGRAPHY.H5}
                marginTop={0}
                marginBottom={2}
              >
                {`${collectionName ?? t('unknownCollection')} (${nfts.length})`}
              </Typography>
            </Box>
            <Box alignItems={ALIGN_ITEMS.FLEX_END}>
              <i
                className={`nfts-items__collection__icon-chevron fa fa-chevron-${
                  isExpanded ? 'down' : 'right'
                }`}
              />
            </Box>
          </Box>
        </button>

        {isExpanded ? (
          <Box display={DISPLAY.FLEX} flexWrap={FLEX_WRAP.WRAP} gap={4}>
            {nfts.map((nft, i) => {
              const { image, address, tokenId, backgroundColor, name } = nft;
              const nftImage = getAssetImageURL(image, ipfsGateway);
              const handleImageClick = () =>
                history.push(`${ASSET_ROUTE}/${address}/${tokenId}`);

              return (
                <Box
                  width={width}
                  key={`nft-${i}`}
                  className="nfts-items__item-wrapper"
                >
                  <Card
                    padding={0}
                    justifyContent={JUSTIFY_CONTENT.CENTER}
                    className="nfts-items__item-wrapper__card"
                  >
                    {nftImage ? (
                      <div
                        className="nfts-items__item"
                        style={{
                          backgroundColor,
                        }}
                      >
                        <img
                          onClick={handleImageClick}
                          className="nfts-items__item-image"
                          src={nftImage}
                        />
                      </div>
                    ) : (
                      <NftDefaultImage
                        name={name}
                        tokenId={tokenId}
                        handleImageClick={handleImageClick}
                      />
                    )}
                  </Card>
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
