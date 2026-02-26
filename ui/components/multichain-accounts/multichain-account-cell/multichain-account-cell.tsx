import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import {
  Box,
  BoxAlignItems,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  getDefaultScopeAndAddressByAccountGroupId,
  getIconSeedAddressByAccountGroupId,
} from '../../../selectors/multichain-accounts/account-tree';
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
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../hooks/useI18nContext';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../app/scripts/lib/multichain/address';
import { shortenAddress } from '../../../helpers/utils/util';

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

/**
 * Renders default address + copy only when needed
 * @param options0
 * @param options0.accountId
 */
const AccountCellDefaultAddress = ({
  accountId,
}: {
  accountId: AccountGroupId;
}) => {
  const t = useI18nContext();
  const { defaultAddress } = useSelector((state) =>
    getDefaultScopeAndAddressByAccountGroupId(state, accountId),
  );
  const [addressCopied, handleCopy] = useCopyToClipboard({
    clearDelayMs: null,
  });
  const handleAddressCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (defaultAddress) {
        handleCopy(normalizeSafeAddress(defaultAddress));
      }
    },
    [defaultAddress, handleCopy],
  );

  if (!defaultAddress) {
    return null;
  }

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      flexDirection={BoxFlexDirection.Row}
      gap={1}
      marginLeft={3}
      onClick={handleAddressCopy}
      data-testid="multichain-account-cell-address"
      aria-label={t('copyAddressShort')}
    >
      <Text
        variant={TextVariant.BodySm}
        color={
          addressCopied ? TextColor.SuccessDefault : TextColor.TextAlternative
        }
      >
        {addressCopied
          ? t('addressCopied')
          : shortenAddress(normalizeSafeAddress(defaultAddress))}
      </Text>
      <Icon
        name={addressCopied ? IconName.CopySuccess : IconName.Copy}
        size={IconSize.Xs}
        color={
          addressCopied ? IconColor.SuccessDefault : IconColor.IconAlternative
        }
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
  avatarWrapper?: (avatar: React.ReactNode) => React.ReactNode;
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
  avatarWrapper,
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
        {avatarWrapper ? (
          avatarWrapper(
            <AccountCellAvatar
              seedAddress={seedAddressIcon}
              connectionStatus={connectionStatus}
              hideTooltip
            />,
          )
        ) : (
          <AccountCellAvatar
            seedAddress={seedAddressIcon}
            connectionStatus={connectionStatus}
          />
        )}
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
          {showDefaultAddress && (
            <AccountCellDefaultAddress accountId={accountId} />
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
