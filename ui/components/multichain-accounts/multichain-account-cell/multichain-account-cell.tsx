import React from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { getIconSeedAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import { SensitiveText } from '../../component-library';
import { TextVariant as TextVariantDeprecated } from '../../../helpers/constants/design-system';
import { ConnectedStatus } from '../../multichain/connected-status/connected-status';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
} from '../../../helpers/constants/connected-sites';
import { MultichainAccountCellDefaultAddress } from '../multichain-account-cell-default-address';

type AccountCellAvatarProps = {
  seedAddress: string;
  selected?: boolean;
  connectionStatus?:
    | typeof STATUS_CONNECTED
    | typeof STATUS_CONNECTED_TO_ANOTHER_ACCOUNT;
  hideTooltip?: boolean;
};

const AccountCellAvatar = ({
  seedAddress,
  selected = false,
  connectionStatus,
  hideTooltip = false,
}: AccountCellAvatarProps) => {
  return (
    <Box
      className={`w-9 h-9 flex-shrink-0 rounded-[10px]${
        selected ? ' outline outline-[1.5px] outline-primary-default' : ''
      }`}
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      data-testid="account-cell-avatar"
    >
      <ConnectedStatus
        address={seedAddress}
        isActive={connectionStatus === STATUS_CONNECTED}
        showConnectedStatus={Boolean(connectionStatus)}
        hideTooltip={hideTooltip}
      />
    </Box>
  );
};

export type MultichainAccountCellProps = {
  accountId: AccountGroupId;
  accountName: string | React.ReactNode;
  accountNameString?: string; // Optional string version for accessibility labels
  onClick?: (accountGroupId: AccountGroupId) => void;
  balance: string;
  startAccessory?: React.ReactNode;
  endAccessory?: React.ReactNode;
  selected?: boolean;
  walletName?: string;
  disableHoverEffect?: boolean;
  connectionStatus?:
    | typeof STATUS_CONNECTED
    | typeof STATUS_CONNECTED_TO_ANOTHER_ACCOUNT;
  privacyMode?: boolean;
  showDefaultAddress?: boolean;
};

export const MultichainAccountCell = ({
  accountId,
  accountName,
  accountNameString,
  onClick,
  balance,
  startAccessory,
  endAccessory,
  selected = false,
  walletName,
  disableHoverEffect = false,
  connectionStatus,
  privacyMode = false,
  showDefaultAddress = false,
}: MultichainAccountCellProps) => {
  const handleClick = () => onClick?.(accountId);

  // Use accountNameString for aria-label, or fallback to accountName if it's a string
  const ariaLabelName =
    accountNameString ||
    (typeof accountName === 'string' ? accountName : 'Account');
  const seedAddressIcon = useSelector((state) =>
    getIconSeedAddressByAccountGroupId(state, accountId),
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
      }}
      paddingVertical={3}
      paddingHorizontal={4}
      gap={4}
      onClick={handleClick}
      className={`multichain-account-cell${disableHoverEffect ? ' multichain-account-cell--no-hover' : ''}${selected && !startAccessory ? ' is-selected' : ''}`}
      data-testid={`multichain-account-cell-${accountId}`}
      key={`multichain-account-cell-${accountId}`}
    >
      {startAccessory}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Start}
        style={{ minWidth: 0, flex: 1 }}
      >
        <AccountCellAvatar
          seedAddress={seedAddressIcon}
          selected={selected}
          connectionStatus={connectionStatus}
        />
        <Box marginLeft={2} style={{ overflow: 'hidden' }}>
          {/* Prevent overflow of account name by long account names */}
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
            className="min-w-0"
          >
            <Text
              className={`multichain-account-cell__account-name pl-2${selected ? ' multichain-account-cell__account-name--selected' : ''}`}
              color={selected ? TextColor.PrimaryDefault : undefined}
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              ellipsis
              data-testid={`multichain-account-cell-name-${ariaLabelName}`}
            >
              {accountName}
            </Text>
            {selected && !startAccessory && (
              <Icon
                className="flex-shrink-0"
                name={IconName.Check}
                size={IconSize.Md}
                color={IconColor.PrimaryDefault}
                data-testid="multichain-account-cell-selected-check"
              />
            )}
          </Box>
          {walletName && (
            <Text
              className="multichain-account-cell__account-name"
              color={TextColor.TextAlternative}
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              ellipsis
            >
              {walletName}
            </Text>
          )}
          {showDefaultAddress && (
            <Box
              flexDirection={BoxFlexDirection.Row}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              data-testid="multichain-account-cell-hovered-addresses"
            >
              <MultichainAccountCellDefaultAddress groupId={accountId} />
            </Box>
          )}
        </Box>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        gap={1}
        style={{ flexShrink: 0 }}
      >
        <SensitiveText
          className="multichain-account-cell__account-balance"
          data-testid="balance-display"
          variant={TextVariantDeprecated.bodyMdMedium}
          isHidden={privacyMode}
          ellipsis
        >
          {balance}
        </SensitiveText>
        <Box
          className="multichain-account-cell__end_accessory"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.End}
          data-testid="multichain-account-cell-end-accessory"
          aria-label={`${ariaLabelName} options`}
        >
          {endAccessory}
        </Box>
      </Box>
    </Box>
  );
};
