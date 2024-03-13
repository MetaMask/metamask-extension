import React from 'react';
import PropTypes from 'prop-types';
import { SubjectType } from '@metamask/permission-controller';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  AvatarFavicon,
  BadgeWrapper,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import { getURLHost } from '../../../../helpers/utils/util';
import SnapAvatar from '../../../app/snaps/snap-avatar/snap-avatar';
import { ConnectionListTooltip } from './connection-list-tooltip/connection-list-tooltip';

export const ConnectionListItem = ({ connection, onClick }) => {
  const t = useI18nContext();
  const isSnap = connection.subjectType === SubjectType.Snap;

  return (
    <Box
      data-testid="connection-list-item"
      as="button"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.baseline}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
      onClick={onClick}
      padding={4}
      gap={4}
    >
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        style={{ alignSelf: 'center' }}
      >
        {isSnap ? (
          <SnapAvatar
            className="connection-list-item__snap-avatar"
            snapId={connection.id}
            badgeSize={IconSize.Xs}
            avatarSize={IconSize.Md}
            borderWidth={0}
          />
        ) : (
          <BadgeWrapper
            badge={
              <Icon
                name={IconName.Global}
                color={IconColor.iconDefault}
                size={IconSize.Xs}
                borderColor={BackgroundColor.backgroundDefault}
              />
            }
          >
            <AvatarFavicon
              data-testid="connection-list-item__avatar-favicon"
              src={connection.iconUrl}
            />
          </BadgeWrapper>
        )}
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        width={BlockSize.FiveTwelfths}
        style={{ alignSelf: 'center', flexGrow: '1' }}
      >
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Left} ellipsis>
          {isSnap ? connection.packageName : getURLHost(connection.origin)}
        </Text>
        {isSnap ? null : (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
            gap={1}
          >
            <Text
              as="span"
              width={BlockSize.Max}
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMd}
            >
              {t('connectedWith')}
            </Text>
            <ConnectionListTooltip connection={connection} />
          </Box>
        )}
      </Box>
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexEnd}
        alignItems={AlignItems.center}
        style={{ flex: '1', alignSelf: 'center' }}
        gap={2}
      >
        <Icon
          display={Display.Flex}
          name={IconName.ArrowRight}
          color={IconColor.iconDefault}
          size={IconSize.Sm}
          backgroundColor={BackgroundColor.backgroundDefault}
        />
      </Box>
    </Box>
  );
};

ConnectionListItem.propTypes = {
  /**
   * The connection data to display
   */
  connection: PropTypes.object.isRequired,
  /**
   * The function to call when the connection is clicked
   */
  onClick: PropTypes.func.isRequired,
};
