import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from 'react-tippy';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BorderStyle,
  Display,
  FlexDirection,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { AvatarType } from '../../../avatar-group/avatar-group.types';
import { AvatarGroup } from '../../..';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
  Box,
  Text,
} from '../../../../component-library';
import { getUseBlockie } from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export const ConnectionListTooltip = ({ connection }) => {
  const t = useI18nContext();
  const AVATAR_GROUP_LIMIT = 5;
  const TOOLTIP_LIMIT = 7;
  const addressIconList = connection.addresses
    ?.slice(0, TOOLTIP_LIMIT)
    .map((address) => ({
      avatarValue: address,
    }));
  const useBlockie = useSelector(getUseBlockie);
  const avatarAccountVariant = useBlockie
    ? AvatarAccountVariant.Blockies
    : AvatarAccountVariant.Jazzicon;

  return (
    <Tooltip
      position="bottom"
      html={
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Text
            color={TextColor.overlayInverse}
            variant={TextVariant.headingSm}
            paddingInline={10}
          >
            {t('connectedAccounts')}
          </Text>
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
            {connection.addresses?.slice(0, TOOLTIP_LIMIT).map((address) => {
              return (
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  alignItems={AlignItems.center}
                  textAlign={TextAlign.Left}
                  key={`cl-tooltip-${connection.addressToNameMap[address]}-${address}`}
                  padding={1}
                  paddingInline={2}
                  gap={2}
                >
                  <AvatarAccount
                    size={AvatarAccountSize.Xs}
                    address={address}
                    variant={avatarAccountVariant}
                    borderStyle={BorderStyle.none}
                  />
                  <Text
                    color={TextColor.overlayInverse}
                    variant={TextVariant.bodyMdMedium}
                    data-testid="connection-list-item-connected-account-name"
                    ellipsis
                  >
                    {connection.addressToNameMap[address]}
                  </Text>
                </Box>
              );
            })}
            {connection.addresses?.length > TOOLTIP_LIMIT && (
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                textAlign={TextAlign.Left}
                paddingInline={2}
              >
                <Text
                  color={TextColor.textMuted}
                  variant={TextVariant.bodyMdMedium}
                  data-testid="connection-list-item-plus-more-tooltip"
                >
                  {t('plusMore', [
                    connection.addresses?.length - TOOLTIP_LIMIT,
                  ])}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      }
      arrow
      offset={0}
      delay={50}
      duration={0}
      size="small"
      title={t('alertDisableTooltip')}
      trigger="mouseenter focus"
      theme="dark"
      tag="div"
    >
      <AvatarGroup
        members={addressIconList}
        limit={AVATAR_GROUP_LIMIT}
        avatarType={AvatarType.ACCOUNT}
        borderColor={BackgroundColor.backgroundDefault}
      />
    </Tooltip>
  );
};
ConnectionListTooltip.propTypes = {
  /**
   * The connection data to display
   */
  connection: PropTypes.object.isRequired,
};
