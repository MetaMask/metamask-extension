import React from 'react';
import PropTypes from 'prop-types';
import { SubjectType } from '@metamask/permission-controller';
import { Tooltip } from 'react-tippy';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderStyle,
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
  AvatarAccount,
  AvatarAccountSize,
  AvatarAccountVariant,
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
import { AvatarGroup } from '../../avatar-group';
import { AvatarType } from '../../avatar-group/avatar-group.types';
import { getUseBlockie } from '../../../../selectors';

export const ConnectionListItem = ({ connection, onClick }) => {
  const t = useI18nContext();
  const isSnap = connection.subjectType === SubjectType.Snap;
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
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        style={{ alignSelf: 'center' }}
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
            <Tooltip
              position="bottom"
              html={
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                >
                  <Text
                    color={TextColor.textDefault}
                    variant={TextVariant.headingSm}
                    paddingInline={10}
                  >
                    {t('connectedAccounts')}
                  </Text>
                  <Box
                    display={Display.Flex}
                    flexDirection={FlexDirection.Column}
                  >
                    {connection.addresses
                      .slice(0, TOOLTIP_LIMIT)
                      .map((address) => {
                        return (
                          <Box
                            display={Display.Flex}
                            flexDirection={FlexDirection.Row}
                            alignItems={AlignItems.center}
                            textAlign={TextAlign.Left}
                            key={address}
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
                              color={TextColor.textDefault}
                              variant={TextVariant.bodyMdMedium}
                              key={address}
                              data-testid="connection-list-item-connected-account-name"
                              ellipsis
                            >
                              {connection.addressToNameMap[address]}
                            </Text>
                          </Box>
                        );
                      })}
                    {connection.addresses.length > TOOLTIP_LIMIT && (
                      <Box
                        display={Display.Flex}
                        alignItems={AlignItems.center}
                        textAlign={TextAlign.Left}
                        paddingInline={2}
                      >
                        <Text
                          color={TextColor.textAlternative}
                          variant={TextVariant.bodyMdMedium}
                          data-testid="connection-list-item-plus-more-tooltip"
                        >
                          {t('plusMore', [
                            connection.addresses.length - TOOLTIP_LIMIT,
                          ])}
                        </Text>
                      </Box>
                    )}
                  </Box>
                </Box>
              }
              arrow
              offset={0}
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
