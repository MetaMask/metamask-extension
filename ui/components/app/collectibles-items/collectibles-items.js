import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Box from '../../ui/box';
import Typography from '../../ui/typography/typography';
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
import { getIpfsGateway } from '../../../selectors';
import { ASSET_ROUTE } from '../../../helpers/constants/routes';
import { getAssetImageURL } from '../../../helpers/utils/util';

const width =
  getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
    ? BLOCK_SIZES.ONE_THIRD
    : BLOCK_SIZES.ONE_SIXTH;
export default function CollectiblesItems({ collections = {} }) {
  const defaultDropdownState = {};
  const ipfsGateway = useSelector(getIpfsGateway);

  Object.keys(collections).forEach((key) => {
    defaultDropdownState[key] = true;
  });
  const history = useHistory();

  const [dropdownState, setDropdownState] = useState(defaultDropdownState);
  return (
    <div className="collectibles-items">
      <Box padding={[6, 4]} flexDirection={FLEX_DIRECTION.COLUMN}>
        <>
          {Object.keys(collections).map((key, index) => {
            const {
              collectibles,
              collectionName,
              collectionImage,
            } = collections[key];

            const isExpanded = dropdownState[key];
            return (
              <div
                className="collectibles-items__item"
                key={`collection-${index}`}
                onClick={() => {
                  setDropdownState((_dropdownState) => ({
                    ..._dropdownState,
                    [key]: !isExpanded,
                  }));
                }}
              >
                <Box
                  marginBottom={2}
                  display={DISPLAY.FLEX}
                  alignItems={ALIGN_ITEMS.CENTER}
                  justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
                  className="collectibles-items__item__accordion-title"
                >
                  <Box
                    alignItems={ALIGN_ITEMS.CENTER}
                    className="collectibles-items__item__collection-header"
                  >
                    {collectionImage ? (
                      <img
                        src={collectionImage}
                        className="collectibles-items__item__collection-image"
                      />
                    ) : (
                      <div className="collectibles-items__item__collection-image-alt">
                        {collectionName[0]}
                      </div>
                    )}
                    <Typography
                      color={COLORS.BLACK}
                      variant={TYPOGRAPHY.H5}
                      margin={[0, 0, 0, 2]}
                    >
                      {`${collectionName} (${collectibles.length})`}
                    </Typography>
                  </Box>
                  <Box alignItems={ALIGN_ITEMS.FLEX_END}>
                    <i
                      className={`fa fa-chevron-${
                        isExpanded ? 'down' : 'right'
                      }`}
                    />
                  </Box>
                </Box>
                {isExpanded ? (
                  <Box display={DISPLAY.FLEX} flexWrap={FLEX_WRAP.WRAP} gap={4}>
                    {collectibles.map((collectible, i) => {
                      const {
                        image,
                        address,
                        tokenId,
                        backgroundColor,
                      } = collectible;
                      const collectibleImage = getAssetImageURL(
                        image,
                        ipfsGateway,
                      );
                      return (
                        <Box width={width} key={`collectible-${i}`}>
                          <div
                            className="collectibles-items__image__wrapper"
                            style={{
                              backgroundColor,
                            }}
                          >
                            <img
                              onClick={() =>
                                history.push(
                                  `${ASSET_ROUTE}/${address}/${tokenId}`,
                                )
                              }
                              className="collectibles-items__image"
                              src={collectibleImage}
                            />
                          </div>
                        </Box>
                      );
                    })}
                  </Box>
                ) : null}
              </div>
            );
          })}
        </>
      </Box>
    </div>
  );
}

CollectiblesItems.propTypes = {
  collections: PropTypes.shape({
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
    collectionImage: PropTypes.string,
    collectionName: PropTypes.string,
  }),
};
