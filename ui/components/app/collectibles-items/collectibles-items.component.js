import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  TEXT_ALIGN,
  JUSTIFY_CONTENT,
  FLEX_DIRECTION,
  ALIGN_ITEMS,
  DISPLAY,
  BLOCK_SIZES,
  SIZES,
  FLEX_WRAP,
} from '../../../helpers/constants/design-system';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { getIpfsGateway } from '../../../selectors';
import { ASSET_ROUTE } from '../../../helpers/constants/routes';
import { getAssetImageURL } from '../../../helpers/utils/util';

const width =
  getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
    ? BLOCK_SIZES.ONE_THIRD
    : BLOCK_SIZES.ONE_SIXTH;
export default function CollectiblesItems({
  onAddNFT,
  onRefreshList,
  collections,
  useCollectibleDetection,
  onEnableAutoDetect,
}) {
  const t = useI18nContext();
  const defaultDropdownState = {};
  const ipfsGateway = useSelector(getIpfsGateway);

  Object.keys(collections).forEach((key) => {
    defaultDropdownState[key] = true;
  });
  const history = useHistory();

  const [dropdownState, setDropdownState] = useState(defaultDropdownState);
  return (
    <div className="collectibles-items">
      <Box padding={[4, 6, 4, 6]} flexDirection={FLEX_DIRECTION.COLUMN}>
        <>
          {Object.keys(collections).map((key, index) => {
            const {
              collectibles,
              collectionName,
              collectionImage,
            } = collections[key];

            const isExpanded = dropdownState[key];
            return (
              <div key={`collection-${index}`}>
                <Box
                  marginTop={4}
                  marginBottom={4}
                  display={DISPLAY.FLEX}
                  alignItems={ALIGN_ITEMS.CENTER}
                  justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
                >
                  <Box alignItems={ALIGN_ITEMS.CENTER}>
                    {collectionImage ? (
                      <img
                        style={{ width: '1.5rem', borderRadius: '50%' }}
                        src={collectionImage}
                      />
                    ) : (
                      <div className="collection-icon">{collectionName[0]}</div>
                    )}
                    <Typography
                      color={COLORS.BLACK}
                      variant={TYPOGRAPHY.H4}
                      margin={[0, 0, 0, 2]}
                    >
                      {`${collectionName} (${collectibles.length})`}
                    </Typography>
                  </Box>
                  <Box alignItems={ALIGN_ITEMS.FLEX_END}>
                    <i
                      className={`fa fa-lg fa-chevron-${
                        isExpanded ? 'down' : 'right'
                      }`}
                      onClick={() => {
                        setDropdownState((_dropdownState) => ({
                          ..._dropdownState,
                          [key]: !isExpanded,
                        }));
                      }}
                    />
                  </Box>
                </Box>
                {isExpanded ? (
                  <Box display={DISPLAY.FLEX} flexWrap={FLEX_WRAP.WRAP}>
                    {collectibles.map((collectible, i) => {
                      const { image, address, tokenId } = collectible;
                      const collectibleImage = getAssetImageURL(
                        image,
                        ipfsGateway,
                      );
                      return (
                        <Box width={width} margin={1} key={`collectible-${i}`}>
                          <Box
                            borderRadius={SIZES.MD}
                            backgroundColor={collectible.backgroundColor}
                            display={DISPLAY.FLEX}
                            justifyContent={JUSTIFY_CONTENT.CENTER}
                            padding={2}
                            width={BLOCK_SIZES.FULL}
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
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                ) : null}
              </div>
            );
          })}
          <Box
            marginTop={6}
            flexDirection={FLEX_DIRECTION.COLUMN}
            justifyContent={JUSTIFY_CONTENT.CENTER}
          >
            <Typography
              color={COLORS.UI3}
              variant={TYPOGRAPHY.H5}
              align={TEXT_ALIGN.CENTER}
            >
              {t('missingNFT')}
            </Typography>
            <Box
              alignItems={ALIGN_ITEMS.CENTER}
              justifyContent={JUSTIFY_CONTENT.CENTER}
            >
              {' '}
              {useCollectibleDetection ? (
                <Box justifyContent={JUSTIFY_CONTENT.FLEX_END}>
                  <Button
                    type="link"
                    onClick={onRefreshList}
                    style={{ padding: '4px', fontSize: '16px' }}
                  >
                    {t('refreshList')}
                  </Button>
                </Box>
              ) : (
                <Box justifyContent={JUSTIFY_CONTENT.FLEX_END}>
                  <Button
                    type="link"
                    onClick={onEnableAutoDetect}
                    style={{ padding: '4px', fontSize: '16px' }}
                  >
                    {t('enableAutoDetect')}
                  </Button>
                </Box>
              )}
              <Typography
                color={COLORS.UI3}
                variant={TYPOGRAPHY.H4}
                align={TEXT_ALIGN.CENTER}
              >
                {t('or')}
              </Typography>
              <Box justifyContent={JUSTIFY_CONTENT.FLEX_START}>
                <Button
                  type="link"
                  onClick={onAddNFT}
                  style={{ padding: '4px', fontSize: '16px' }}
                >
                  {t('importNFTs')}
                </Button>
              </Box>
            </Box>
          </Box>
        </>
      </Box>
    </div>
  );
}

CollectiblesItems.propTypes = {
  onAddNFT: PropTypes.func.isRequired,
  onRefreshList: PropTypes.func.isRequired,
  collections: PropTypes.array,
  useCollectibleDetection: PropTypes.bool.isRequired,
  onEnableAutoDetect: PropTypes.func.isRequired,
};
