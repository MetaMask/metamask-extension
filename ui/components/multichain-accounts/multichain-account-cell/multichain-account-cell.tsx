import React from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
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
  connectionStatus?:
    | typeof STATUS_CONNECTED
    | typeof STATUS_CONNECTED_TO_ANOTHER_ACCOUNT;
  hideTooltip?: boolean;
};

const AccountCellAvatar = ({
  seedAddress,
  connectionStatus,
  hideTooltip = false,
}: AccountCellAvatarProps) => {
  return (
    <Box
      className="w-10 h-10 flex-shrink-0"
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      borderColor={BoxBorderColor.Transparent}
      borderWidth={2}
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
  /**
   * When true, the cell ignores clicks and shows reduced opacity so the user
   * sees that an account switch is in progress (React useTransition pending).
   */
  pending?: boolean;
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
  pending = false,
}: MultichainAccountCellProps) => {
  const handleClick = () => {
    if (pending) {
      return;
    }
    onClick?.(accountId);
  };

  let cursor: React.CSSProperties['cursor'] = 'default';
  if (pending) {
    cursor = 'wait';
  } else if (onClick) {
    cursor = 'pointer';
  }

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
        cursor,
        position: 'relative',
        opacity: pending ? 0.6 : undefined,
        pointerEvents: pending ? 'none' : undefined,
      }}
      padding={4}
      gap={4}
      onClick={handleClick}
      className={`multichain-account-cell${disableHoverEffect ? ' multichain-account-cell--no-hover' : ''}${selected && !startAccessory ? ' is-selected' : ''}${pending ? ' is-pending' : ''}`}
      data-testid={`multichain-account-cell-${accountId}`}
      key={`multichain-account-cell-${accountId}`}
      aria-busy={pending || undefined}
      backgroundColor={
        selected && !startAccessory
          ? BoxBackgroundColor.BackgroundMuted
          : BoxBackgroundColor.Transparent
      }
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
          connectionStatus={connectionStatus}
        />
        <Box marginLeft={3} style={{ overflow: 'hidden' }}>
          {/* Prevent overflow of account name by long account names */}
          <Text
            className="multichain-account-cell__account-name"
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            ellipsis
            data-testid={`multichain-account-cell-name-${ariaLabelName}`}
          >
            {accountName}
          </Text>
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
        style={{ flexShrink: 0 }}
      >
        <SensitiveText
          className="multichain-account-cell__account-balance"
          data-testid="balance-display"
          variant={TextVariantDeprecated.bodyMdMedium}
          marginRight={2}
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
