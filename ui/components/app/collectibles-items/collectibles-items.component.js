import React, { useState } from 'react';
import PropTypes from 'prop-types';
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

export default function CollectiblesItems({
  onAddNFT,
  onRefreshList,
  collections,
}) {
  const t = useI18nContext();
  const defaultDropdownState = {};

  Object.keys(collections).forEach((key) => {
    defaultDropdownState[key] = true;
  });

  const [dropdownState, setDropdownState] = useState(defaultDropdownState);
  const width =
    getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
      ? BLOCK_SIZES.ONE_THIRD
      : BLOCK_SIZES.ONE_SIXTH;
  return (
    <div className="collectibles-items">
      <Box padding={[4, 6, 4, 6]} flexDirection={FLEX_DIRECTION.COLUMN}>
        <>
          {Object.keys(collections).map((key, index) => {
            const { collectibles, collectionName, collectionImage } = collections[key]
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
                    // todo backup image?
                    <img width="28" src={collectionImage} />
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
                      return (
                        <Box width={width} padding={2} key={`collectible-${i}`}>
                          <Box
                            borderRadius={SIZES.MD}
                            backgroundColor={collectible.backgroundColor}
                          >
                            <img width="40px" src={collectible.image} />
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
              <Box justifyContent={JUSTIFY_CONTENT.FLEX_END}>
                <Button
                  type="link"
                  onClick={onRefreshList}
                  style={{ padding: '4px' }}
                >
                  {t('refreshList')}
                </Button>
              </Box>
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
                  style={{ padding: '4px' }}
                >
                  {t('addNFTLowerCase')}
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
};
