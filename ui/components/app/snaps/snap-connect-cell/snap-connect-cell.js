import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  IconColor,
  AlignItems,
  Display,
  FontWeight,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import Tooltip from '../../../ui/tooltip/tooltip';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getSnapMetadata } from '../../../../selectors';
import { SnapIcon } from '../snap-icon';

export default function SnapConnectCell({ origin, snapId }) {
  const t = useI18nContext();
  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      paddingTop={2}
      paddingBottom={2}
    >
      <SnapIcon snapId={snapId} />
      <Box width="full" paddingLeft={4} paddingRight={4}>
        <Text>
          {t('connectSnap', [
            <Text
              variant={TextVariant.inherit}
              key="1"
              fontWeight={FontWeight.Bold}
            >
              {snapName}
            </Text>,
          ])}
        </Text>
      </Box>
      <Box>
        <Tooltip
          html={
            <div>
              {t('snapConnectionWarning', [
                <b key="0">{origin}</b>,
                <b key="1">{snapName}</b>,
              ])}
            </div>
          }
          position="bottom"
        >
          <Icon
            color={IconColor.iconMuted}
            name={IconName.Info}
            size={IconSize.Sm}
          />
        </Tooltip>
      </Box>
    </Box>
  );
}

SnapConnectCell.propTypes = {
  origin: PropTypes.string.isRequired,
  snapId: PropTypes.string.isRequired,
};
