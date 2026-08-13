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
  SensitiveText,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { getIconSeedAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
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

type BalanceDisplayProps = {
  balance: string;
  isSubtitle?: boolean;
  isHidden?: boolean;
};

const BalanceDisplay = ({
  balance,
  isSubtitle = false,
  isHidden = false,
}: BalanceDisplayProps) => {
  return (
    <SensitiveText
      className="multichain-account-cell__account-balance"
      data-testid={isSubtitle ? 'balance-display-subtitle' : 'balance-display'}
      variant={isSubtitle ? TextVariant.BodySm : TextVariant.BodyMd}
      color={isSubtitle ? TextColor.TextAlternative : undefined}
      fontWeight={isSubtitle ? undefined : FontWeight.Medium}
      style={isSubtitle ? undefined : { marginRight: 8 }}
      ellipsis
      isHidden={isHidden}
    >
      {balance}
    </SensitiveText>
  );
};

export type MultichainAccountCellProps = {
  accountId: AccountGroupId;
  accountName: string | React.ReactNode;
  accountNameString?: string; // Optional string version for accessibility labels
  onClick?: (accountGroupId: AccountGroupId) => void;
  balance: string;
  balancePosition?: 'end' | 'subtitle';
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
  balancePosition = 'end',
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
          {balancePosition === 'subtitle' && (
            <BalanceDisplay
              balance={balance}
              isHidden={privacyMode}
              isSubtitle
            />
          )}
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
        {balancePosition === 'end' && (
          <BalanceDisplay balance={balance} isHidden={privacyMode} />
        )}
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
