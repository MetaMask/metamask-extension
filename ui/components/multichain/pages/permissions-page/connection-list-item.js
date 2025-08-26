import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { SubjectType } from '@metamask/permission-controller';
import { useSelector } from 'react-redux';
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
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import { getURLHost } from '../../../../helpers/utils/util';
import { SnapIcon } from '../../../app/snaps/snap-icon';
import {
  getAllPermittedChainsForSelectedTab,
  getIsMultichainAccountsState2Enabled,
} from '../../../../selectors';
import { getAccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree';

export const ConnectionListItem = ({ connection, onClick }) => {
  const t = useI18nContext();
  const isSnap = connection.subjectType === SubjectType.Snap;
  const permittedChains = useSelector((state) =>
    getAllPermittedChainsForSelectedTab(state, connection.origin),
  );
  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);

  const isState2Enabled = useSelector(getIsMultichainAccountsState2Enabled);

  const acccountsToShow = useMemo(() => {
    if (isState2Enabled) {
      console.log('isState2Enabled', isState2Enabled);
      const accountGroupsToShow = connection.addresses
        .map((address) => {
          const accountGroup = accountGroups.find((group) =>
            group.accounts.some((account) => account.address === address),
          );

          return accountGroup;
        })
        .filter((account) => account !== undefined);

      return accountGroupsToShow.length;
    }
    return connection.addresses.length;
  }, [accountGroups, connection.addresses, isState2Enabled]);

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
      className="multichain-connection-list-item"
    >
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        style={{ alignSelf: 'center' }}
      >
        {isSnap ? (
          <SnapIcon
            className="connection-list-item__snap-avatar"
            snapId={connection.id}
            avatarSize={IconSize.Md}
          />
        ) : (
          <AvatarFavicon
            data-testid="connection-list-item__avatar-favicon"
            src={connection.iconUrl}
          />
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
              {acccountsToShow} {t('accountsSmallCase')} •&nbsp;
              {permittedChains.length} {t('networksSmallCase')}
            </Text>
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
