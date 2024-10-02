import React from 'react';
import PropTypes from 'prop-types';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  Text,
} from '../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { formatDate } from '../../../helpers/utils/util';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';

/**
 * Renders status of the given permission. Used by PermissionCell component.
 *
 * @param props - The props.
 * @param props.revoked - Boolean value to identify if permission is being revoked.
 * @param props.dateApproved - Timestamp when permission is approved.
 * @param props.accounts - List of accounts for which permission is requested, approved or revoked.
 * @param props.approved - Boolean value in case a permission has been approved, but there is no date to show.
 * @param props.networks
 * @returns React element rendering permission status with or without account icons displayed as AvatarGroup.
 */
export const PermissionCellStatus = ({
  revoked,
  approved,
  dateApproved,
  accounts,
  networks,
}) => {
  const t = useI18nContext();

  const renderAccountsGroup = () => (
    <>
      <Box
        as="span"
        className="permission-cell__status__accounts-group-box"
        display={Display.InlineFlex}
      >
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          {networks?.map((network, index) => (
            <Box
              key={`${network.name}_${index}`}
              display={Display.Flex}
              justifyContent={JustifyContent.flexStart}
              alignItems={AlignItems.center}
              marginTop={2}
            >
              <AvatarNetwork
                size={AvatarNetworkSize.Xs}
                src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[network.chainId]}
                name={network.name}
              />
              <Text variant={TextVariant.bodyMdMedium} marginLeft={2}>
                {network.name}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );

  const getStatusMessage = () => {
    if (revoked) {
      return accounts && accounts.length
        ? t('permissionRevokedForAccounts', [renderAccountsGroup()])
        : t('permissionRevoked');
    }

    if (dateApproved) {
      return accounts && accounts.length
        ? t('approvedOnForAccounts', [
            formatDate(dateApproved, 'yyyy-MM-dd'),
            renderAccountsGroup(),
          ])
        : t('approvedOn', [formatDate(dateApproved, 'yyyy-MM-dd')]);
    }

    if (approved) {
      return t('approved');
    }

    return accounts && accounts.length
      ? t('permissionRequestedForAccounts', [renderAccountsGroup()])
      : t('permissionRequested');
  };

  return (
    <Text
      as="div"
      className="permission-cell__status"
      variant={TextVariant.bodySm}
      color={TextColor.textAlternative}
      display={Display.Flex}
    >
      {getStatusMessage()}
    </Text>
  );
};

PermissionCellStatus.propTypes = {
  revoked: PropTypes.bool,
  approved: PropTypes.bool,
  dateApproved: PropTypes.number,
  accounts: PropTypes.array,
  networks: PropTypes.array,
};
