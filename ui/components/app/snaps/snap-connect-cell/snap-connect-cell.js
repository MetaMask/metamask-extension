import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../../ui/box';
import {
  IconColor,
  Size,
  JustifyContent,
  AlignItems,
  TextColor,
  DISPLAY,
} from '../../../../helpers/constants/design-system';
import { getSnapName } from '../../../../helpers/utils/util';
import {
  BadgeWrapper,
  BadgeWrapperPosition,
  AvatarIcon,
  AvatarFavicon,
  AvatarBase,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import Tooltip from '../../../ui/tooltip/tooltip';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export default function SnapConnectCell({ iconUrl = '', snapId }) {
  const t = useI18nContext()
  const friendlyName = getSnapName(snapId);
  const SnapConnectAvatar = () => {
    return (
      <BadgeWrapper
        className="snaps-connect-cell__avatar"
        badge={
          <AvatarIcon
            iconName={IconName.Snaps}
            size={IconSize.Xs}
            backgroundColor={IconColor.infoDefault}
            iconProps={{
              size: IconSize.Xs,
              color: IconColor.infoInverse,
            }}
          />
        }
        position={BadgeWrapperPosition.bottomRight}
      >
        {iconUrl ? (
          <AvatarFavicon size={Size.MD} src={iconUrl} name={friendlyName} />
        ) : (
          <AvatarBase
            size={Size.MD}
            display={DISPLAY.FLEX}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            color={TextColor.textAlternative}
            style={{ borderWidth: '0px' }}
          >
            {friendlyName}
          </AvatarBase>
        )}
      </BadgeWrapper>
    );
  };

  return (
    <Box>
      <SnapConnectAvatar />
      <Box width="full">
        <Text>{`${t('connect')} ${friendlyName}`}</Text>
      </Box>
      <Box>
        <Tooltip html={<div>{snapId}</div>} position="bottom">
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
  iconUrl: PropTypes.string,
  snapId: PropTypes.string.isRequired,
};
