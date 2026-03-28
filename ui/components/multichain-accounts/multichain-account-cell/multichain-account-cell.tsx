import React from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import {
  Box,
  BoxAlignItems,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { getIconSeedAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import {
  Box as BoxDeprecated,
  SensitiveText,
  Text as TextDeprecated,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  JustifyContent,
  TextColor as TextColorDeprecated,
  TextVariant as TextVariantDeprecated,
} from '../../../helpers/constants/design-system';
import { ConnectedStatus } from '../../multichain/connected-status/connected-status';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
} from '../../../helpers/constants/connected-sites';
import { MultichainHoveredAddressRowsList } from '../multichain-address-rows-hovered-list';
import { MultichainAccountNetworkGroupWithCopyIcon } from '../multichain-account-network-group-with-copy-icon';

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
  showHoverableNetworkGroup?: boolean;
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
  showHoverableNetworkGroup = false,
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
    <BoxDeprecated
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
      }}
      padding={4}
      gap={4}
      onClick={handleClick}
      className={`multichain-account-cell${disableHoverEffect ? ' multichain-account-cell--no-hover' : ''}${selected && !startAccessory ? ' is-selected' : ''}`}
      data-testid={`multichain-account-cell-${accountId}`}
      key={`multichain-account-cell-${accountId}`}
      backgroundColor={
        selected && !startAccessory
          ? BackgroundColor.backgroundMuted
          : BackgroundColor.transparent
      }
    >
      {startAccessory}
      <BoxDeprecated
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.flexStart}
        style={{ minWidth: 0, flex: 1 }}
      >
        <AccountCellAvatar
          seedAddress={seedAddressIcon}
          connectionStatus={connectionStatus}
        />
        <BoxDeprecated style={{ overflow: 'hidden' }}>
          {/* Prevent overflow of account name by long account names */}
          <TextDeprecated
            className="multichain-account-cell__account-name"
            variant={TextVariantDeprecated.bodyMdMedium}
            marginLeft={3}
            ellipsis
          >
            {accountName}
          </TextDeprecated>
          {walletName && (
            <TextDeprecated
              className="multichain-account-cell__account-name"
              color={TextColorDeprecated.textAlternative}
              variant={TextVariantDeprecated.bodySmMedium}
              marginLeft={3}
              ellipsis
            >
              {walletName}
            </TextDeprecated>
          )}
          {showHoverableNetworkGroup && (
            <Box
              flexDirection={BoxFlexDirection.Row}
              marginLeft={3}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              data-testid="multichain-account-cell-hovered-addresses"
            >
              <MultichainHoveredAddressRowsList
                groupId={accountId}
                showAccountHeaderAndBalance={false}
                showDefaultAddressSection={false}
                showViewAllButton={false}
              >
                <MultichainAccountNetworkGroupWithCopyIcon
                  groupId={accountId}
                />
              </MultichainHoveredAddressRowsList>
            </Box>
          )}
        </BoxDeprecated>
      </BoxDeprecated>
      <BoxDeprecated
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
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
        <BoxDeprecated
          className="multichain-account-cell__end_accessory"
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.flexEnd}
          data-testid="multichain-account-cell-end-accessory"
          aria-label={`${ariaLabelName} options`}
        >
          {endAccessory}
        </BoxDeprecated>
      </BoxDeprecated>
    </BoxDeprecated>
  );
};
