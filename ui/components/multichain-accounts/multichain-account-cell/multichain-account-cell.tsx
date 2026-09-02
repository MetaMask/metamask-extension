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
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconColor,
  IconName,
  IconSize,
  SensitiveText,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
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
  balance?: string;
  isSubtitle?: boolean;
  isHidden?: boolean;
};

const BalanceDisplay = ({
  balance,
  isSubtitle = false,
  isHidden = false,
}: BalanceDisplayProps) => {
  // Account group balances are fetched lazily, so a cell may have no balance to
  // show yet. Render nothing rather than a placeholder that reads as "no funds".
  if (!balance) {
    return null;
  }

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

type EditModeVisibilityIconProps = {
  isHidden: boolean;
  ariaLabel: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
};

const EditModeVisibilityIcon = ({
  isHidden,
  ariaLabel,
  onClick,
  disabled = false,
}: EditModeVisibilityIconProps) => (
  <ButtonIcon
    iconName={isHidden ? IconName.EyeSlash : IconName.Eye}
    size={ButtonIconSize.Sm}
    ariaLabel={ariaLabel}
    onClick={onClick}
    isDisabled={disabled}
    className="multichain-account-cell__edit-mode-action-icon flex-shrink-0"
    data-testid={
      isHidden
        ? 'multichain-account-cell-edit-mode-hidden-icon'
        : 'multichain-account-cell-edit-mode-visible-icon'
    }
    iconProps={{
      size: IconSize.Sm,
      color: IconColor.IconAlternative,
    }}
  />
);

type EditModeDeleteIconProps = {
  ariaLabel: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
};

const EditModeDeleteIcon = ({
  ariaLabel,
  onClick,
  disabled = false,
}: EditModeDeleteIconProps) => (
  <ButtonIcon
    iconName={IconName.RemoveMinus}
    size={ButtonIconSize.Sm}
    ariaLabel={ariaLabel}
    onClick={onClick}
    isDisabled={disabled}
    className="multichain-account-cell__edit-mode-action-icon flex-shrink-0"
    data-testid="multichain-account-cell-edit-mode-delete-icon"
    iconProps={{
      size: IconSize.Sm,
      className: IconColor.ErrorDefault,
    }}
  />
);

export type MultichainAccountCellProps = {
  accountId: AccountGroupId;
  accountName: string | React.ReactNode;
  accountNameString?: string; // Optional string version for accessibility labels
  onClick?: (accountGroupId: AccountGroupId) => void;
  /**
   * Formatted balance to display. Omit (or pass an empty string) when no
   * balance is known yet so that nothing is rendered in its place.
   */
  balance?: string;
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
  /**
   * When true, renders the cell in hidden-account mode with muted styling.
   * @default false
   */
  isHidden?: boolean;
  /**
   * When true, renders the cell in edit mode. Suppresses non-edit affordances
   * such as the end accessory menu.
   * @default false
   */
  isEditMode?: boolean;
  /**
   * When true (and in edit mode), replaces the visibility icon with a delete
   * icon. Mutually exclusive with {@link isHidden} — delete mode wins if both
   * are set.
   * @default false
   */
  isDeleteMode?: boolean;
  /**
   * Called when the edit-mode visibility icon is clicked.
   */
  onVisibilityIconClick?: (accountGroupId: AccountGroupId) => void;
  /**
   * Called when the edit-mode delete icon is clicked.
   */
  onDeleteIconClick?: (accountGroupId: AccountGroupId) => void;
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
  isHidden = false,
  isEditMode = false,
  isDeleteMode = false,
  onVisibilityIconClick,
  onDeleteIconClick,
}: MultichainAccountCellProps) => {
  const t = useI18nContext();

  // Delete mode and hidden mode are mutually exclusive; delete mode takes
  // precedence when both are incorrectly set.
  const showDeleteIcon = isEditMode && isDeleteMode;
  const effectiveIsHidden = isHidden && !isDeleteMode;

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

  const shouldDisableHoverEffect = disableHoverEffect || isEditMode;

  const handleVisibilityIconClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    if (pending) {
      return;
    }
    onVisibilityIconClick?.(accountId);
  };

  const handleDeleteIconClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    if (pending) {
      return;
    }
    onDeleteIconClick?.(accountId);
  };

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
      className={`multichain-account-cell${shouldDisableHoverEffect ? ' multichain-account-cell--no-hover' : ''}${selected && !startAccessory ? ' is-selected' : ''}${pending ? ' is-pending' : ''}${effectiveIsHidden ? ' multichain-account-cell--hidden' : ''}${isEditMode ? ' multichain-account-cell--edit-mode' : ''}${showDeleteIcon ? ' multichain-account-cell--delete-mode' : ''}`}
      data-testid={`multichain-account-cell-${accountId}`}
      key={`multichain-account-cell-${accountId}`}
      data-hidden={effectiveIsHidden ? 'true' : undefined}
      data-edit-mode={isEditMode ? 'true' : undefined}
      data-delete-mode={showDeleteIcon ? 'true' : undefined}
      aria-busy={pending || undefined}
      backgroundColor={
        selected && !startAccessory
          ? BoxBackgroundColor.BackgroundMuted
          : BoxBackgroundColor.Transparent
      }
    >
      {startAccessory && !isEditMode ? startAccessory : null}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Start}
        style={{ minWidth: 0, flex: 1 }}
      >
        <AccountCellAvatar
          seedAddress={seedAddressIcon}
          connectionStatus={isEditMode ? undefined : connectionStatus}
        />
        <Box marginLeft={3} style={{ overflow: 'hidden' }}>
          {/* Prevent overflow of account name by long account names */}
          <Text
            className="multichain-account-cell__account-name"
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={effectiveIsHidden ? TextColor.TextAlternative : undefined}
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
        {showDeleteIcon ? (
          <EditModeDeleteIcon
            ariaLabel={t('removeAccount')}
            onClick={handleDeleteIconClick}
            disabled={pending}
          />
        ) : (
          isEditMode && (
            <EditModeVisibilityIcon
              isHidden={effectiveIsHidden}
              ariaLabel={
                effectiveIsHidden ? t('showAccount') : t('hideAccount')
              }
              onClick={handleVisibilityIconClick}
              disabled={pending}
            />
          )
        )}
        <Box
          className="multichain-account-cell__end_accessory"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.End}
          data-testid="multichain-account-cell-end-accessory"
          aria-label={`${ariaLabelName} options`}
        >
          {!isEditMode && endAccessory}
        </Box>
      </Box>
    </Box>
  );
};
