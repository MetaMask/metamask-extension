import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import Box from '../../../ui/box';
import {
  IconColor,
  AlignItems,
  Display,
  FontWeight,
} from '../../../../helpers/constants/design-system';
import { getSnapName } from '../../../../helpers/utils/util';
import {
  Icon,
  IconName,
  IconSize,
  ValidTag,
  Text,
} from '../../../component-library';
import Tooltip from '../../../ui/tooltip/tooltip';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import SnapAvatar from '../snap-avatar/snap-avatar';
import { getTargetSubjectMetadata } from '../../../../selectors';

export default function SnapConnectCell({ origin, snapId }) {
  const t = useI18nContext();
  const snapMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );
  const friendlyName = getSnapName(snapId, snapMetadata);

  return (
    <Box
      alignItems={AlignItems.center}
      paddingTop={2}
      paddingBottom={2}
      display={Display.Flex}
    >
      <SnapAvatar snapId={snapId} />
      <Box width="full" marginLeft={4} marginRight={4}>
        <Text>
          {t('connectSnap', [
            <Text as={ValidTag.Span} key="1" fontWeight={FontWeight.Bold}>
              {friendlyName}
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
                <b key="1">{friendlyName}</b>,
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
