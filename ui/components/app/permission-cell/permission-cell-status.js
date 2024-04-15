import React from 'react';
import PropTypes from 'prop-types';
import {
  AvatarAccount,
  AvatarAccountSize,
  AvatarTokenSize,
  Box,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BlockSize,
  BorderColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import Tooltip from '../../ui/tooltip';
import { AvatarGroup } from '../../multichain';
import { AvatarType } from '../../multichain/avatar-group/avatar-group.types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { formatDate } from '../../../helpers/utils/util';

/**
 * Renders status of the given permission. Used by PermissionCell component.
 *
 * @param props - The props.
 * @param props.revoked - Boolean value to identify if permission is being revoked.
 * @param props.dateApproved - Timestamp when permission is approved.
 * @param props.accounts - List of accounts for which permission is requested, approved or revoked.
 * @returns React element rendering permission status with or without account icons displayed as AvatarGroup.
 */
export const PermissionCellStatus = ({ revoked, dateApproved, accounts }) => {
  const t = useI18nContext();

  const renderAccountsGroup = () => (
    <Box
      as="span"
      className="permission-cell__status__accounts-group-box"
      display={Display.InlineFlex}
    >
      <Tooltip
        position="bottom"
        html={
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
          >
            <Text
              variant={TextVariant.headingSm}
              color={TextColor.textAlternative}
              textAlign={TextAlign.Center}
            >
              {t('accounts')}
            </Text>
            <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
              {accounts.map((account, index) => (
                <Box
                  key={`${account.avatarValue}_${index}`}
                  display={Display.Flex}
                  justifyContent={JustifyContent.flexStart}
                  alignItems={AlignItems.center}
                  marginTop={2}
                >
                  <AvatarAccount
                    address={account.avatarValue}
                    size={AvatarAccountSize.Xs}
                    borderColor={BorderColor.backgroundDefault}
                  />
                  <Text variant={TextVariant.bodyMdMedium} marginLeft={2}>
                    {account.avatarName}
                  </Text>
                </Box>
              ))}
            </Box>
          </Box>
        }
      >
        <AvatarGroup
          limit={3}
          members={accounts}
          avatarType={AvatarType.ACCOUNT}
          size={AvatarTokenSize.Xs}
          width={BlockSize.Min}
          borderColor={BorderColor.backgroundDefault}
          marginLeft={4}
          paddingLeft={4}
        />
      </Tooltip>
    </Box>
  );

  const statusApproved =
    accounts && accounts.length
      ? t('approvedOnForAccounts', [
          formatDate(dateApproved, 'yyyy-MM-dd'),
          renderAccountsGroup(),
        ])
      : t('approvedOn', [formatDate(dateApproved, 'yyyy-MM-dd')]);
  const statusRevoked =
    accounts && accounts.length
      ? t('permissionRevokedForAccounts', [renderAccountsGroup()])
      : t('permissionRevoked');
  const statusRequestedNow =
    accounts && accounts.length
      ? t('permissionRequestedForAccounts', [renderAccountsGroup()])
      : t('permissionRequested');

  return (
    <Text
      as="div"
      className="permission-cell__status"
      variant={TextVariant.bodySm}
      color={TextColor.textAlternative}
      display={Display.Flex}
    >
      {!revoked && (dateApproved ? statusApproved : statusRequestedNow)}
      {revoked ? statusRevoked : ''}
    </Text>
  );
};

PermissionCellStatus.propTypes = {
  revoked: PropTypes.bool,
  dateApproved: PropTypes.number,
  accounts: PropTypes.array,
};
