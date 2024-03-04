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

export const ConnectionListItem = ({ connection, onClick }) => {
  const t = useI18nContext();
  const isSnap = connection.subjectType === SubjectType.Snap;

  return (
    <Box
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
      {isSnap ? (
        <SnapAvatar
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
          <AvatarFavicon src={connection.iconUrl} />
        </BadgeWrapper>
      )}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        width={BlockSize.FiveTwelfths}
        style={{ flexGrow: '1' }}
      >
        <Text
          variant={TextVariant.bodyLgMedium}
          textAlign={TextAlign.Left}
          ellipsis
        >
          {connection.name}
        </Text>
        <Text
          display={Display.Flex}
          alignItems={AlignItems.flexStart}
          color={TextColor.textAlternative}
          variant={TextVariant.bodyMd}
        >
          {isSnap ? connection.packageName : getURLHost(connection.origin)}
        </Text>
      </Box>
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexEnd}
        alignItems={AlignItems.center}
        style={{ flex: '1' }}
        gap={2}
      >
        {!isSnap && (
          <Text
            width={BlockSize.Max}
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMd}
          >
            {connection.addresses?.length}{' '}
            {connection.addresses?.length > 1
              ? t('connectedaccounts')
              : t('connectedaccount')}
          </Text>
        )}
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
