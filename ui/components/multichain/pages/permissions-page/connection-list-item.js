import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { SubjectType } from '@metamask/permission-controller';
import { shallowEqual, useSelector } from 'react-redux';
import {
  AvatarFavicon,
  ContentVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  ListItem,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getURLHost } from '../../../../helpers/utils/util';
import { SnapIcon } from '../../../app/snaps/snap-icon';
import { getAllPermittedChainsForSelectedTab } from '../../../../selectors';
import { getAccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree';

export const ConnectionListItem = ({ connection, onClick }) => {
  const t = useI18nContext();
  const isSnap = connection.subjectType === SubjectType.Snap;
  const permittedChains = useSelector(
    (state) => getAllPermittedChainsForSelectedTab(state, connection.origin),
    shallowEqual,
  );
  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);

  const accountAddressSet = useMemo(() => {
    const set = new Set();
    (accountGroups ?? []).forEach((group) => {
      (group.accounts ?? []).forEach((account) => {
        set.add(account.address);
      });
    });
    return set;
  }, [accountGroups]);

  const accountsToShow = useMemo(() => {
    if (!accountAddressSet || !connection.addresses?.length) {
      return 0;
    }
    let count = 0;
    for (const address of connection.addresses) {
      if (accountAddressSet.has(address)) {
        count += 1;
      }
    }
    return count;
  }, [accountAddressSet, connection.addresses]);

  const accountsLabel =
    accountsToShow === 0 && permittedChains.length === 0
      ? `${connection.advancedPermissionsCount} ${
          connection.advancedPermissionsCount === 1
            ? t('advancedPermissionSmallCase')
            : t('advancedPermissionsSmallCase')
        }`
      : `${accountsToShow} ${
          accountsToShow === 1 ? t('accountSmallCase') : t('accountsSmallCase')
        }`;

  return (
    <ListItem
      variant={ContentVariant.TwoLines}
      isInteractive
      onClick={onClick}
      className="multichain-connection-list-item bg-default"
      data-testid="connection-list-item"
      avatar={
        isSnap ? (
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
        )
      }
      title={isSnap ? connection.packageName : getURLHost(connection.origin)}
      titleProps={{ ellipsis: true }}
      description={isSnap ? undefined : accountsLabel}
      descriptionProps={{ variant: TextVariant.BodyMd }}
      endAccessory={
        <Icon
          name={IconName.ArrowRight}
          color={IconColor.IconDefault}
          size={IconSize.Sm}
        />
      }
    />
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
