import React from 'react';
import { useSelector } from 'react-redux';
import {
  FontWeight,
  SensitiveText,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { ConnectedStatus } from '../../multichain/connected-status/connected-status';
import type { MultichainAccountCellProps } from '../../multichain-accounts/multichain-account-cell/multichain-account-cell';
import { getIconSeedAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import { SideNavAccountAddress } from './side-nav-account-address';

/**
 * Account row component shown in the wide screen side-nav.
 *
 * The balance sits in the subtitle. When the show-default-address preference
 * is on, the scoped default address follows it; otherwise the wallet name
 * passed by the list does, matching {@link MultichainAccountCell}. The whole row is
 * selected through a native button that covers it, so the copy and menu
 * controls sit above that button and keep their own behaviour. The menu is
 * hidden until the row is hovered, and stays visible while its popover is open.
 */
export const SideNavAccountCell = ({
  accountId,
  accountName,
  accountNameString,
  onClick,
  balance,
  selected = false,
  walletName,
  privacyMode = false,
  showDefaultAddress = false,
  pending = false,
  endAccessory,
}: MultichainAccountCellProps) => {
  const seedAddress = useSelector((state) =>
    getIconSeedAddressByAccountGroupId(state, accountId),
  );

  const ariaLabelName =
    accountNameString ||
    (typeof accountName === 'string' ? accountName : 'Account');

  const handleSelect = () => {
    onClick?.(accountId);
  };

  let cursorClass = 'cursor-default';
  if (pending) {
    cursorClass = 'cursor-wait';
  } else if (onClick) {
    cursorClass = 'cursor-pointer';
  }

  const subtitle = showDefaultAddress ? (
    <SideNavAccountAddress groupId={accountId} />
  ) : (
    walletName && (
      <Text
        data-testid="side-nav-account-cell-wallet-name"
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextAlternative}
        ellipsis
        className="min-w-0"
      >
        {walletName}
      </Text>
    )
  );

  return (
    <div
      className={`group/account-cell relative flex w-full min-w-0 items-center gap-4 p-4 transition-colors duration-200 hover:bg-background-default-hover${
        selected ? ' bg-background-muted' : ''
      }${pending ? ' opacity-60' : ''}`}
      data-testid={`side-nav-account-cell-${accountId}`}
      aria-busy={pending || undefined}
    >
      <button
        type="button"
        aria-label={ariaLabelName}
        disabled={pending || !onClick}
        onClick={handleSelect}
        className={`absolute inset-0 ${cursorClass}`}
        data-testid={`side-nav-account-cell-select-${accountId}`}
      />
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className="pointer-events-none flex size-10 shrink-0 items-center justify-center"
          data-testid="side-nav-account-cell-avatar"
        >
          <ConnectedStatus
            address={seedAddress}
            showConnectedStatus={false}
            hideTooltip
          />
        </div>
        <div className="min-w-0 flex-1">
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            ellipsis
            data-testid="side-nav-account-cell-name"
          >
            {accountName}
          </Text>
          {(balance || subtitle) && (
            <div className="flex min-w-0 items-center gap-2">
              {subtitle}
              {balance ? (
                <SensitiveText
                  data-testid="side-nav-account-cell-balance"
                  variant={TextVariant.BodySm}
                  color={TextColor.TextDefault}
                  fontWeight={FontWeight.Medium}
                  ellipsis
                  isHidden={privacyMode}
                  className="w-max"
                >
                  {balance}
                </SensitiveText>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {endAccessory ? (
        <div
          className="relative z-10 flex shrink-0 items-center justify-end opacity-0 pointer-events-none group-hover/account-cell:pointer-events-auto group-hover/account-cell:opacity-100 has-[[aria-expanded=true]]:pointer-events-auto has-[[aria-expanded=true]]:opacity-100"
          data-testid="side-nav-account-cell-menu"
        >
          {endAccessory}
        </div>
      ) : null}
    </div>
  );
};
