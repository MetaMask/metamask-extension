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
import { type MultichainAccountCellProps } from '../../multichain-accounts/multichain-account-cell';
import { getIconSeedAddressByAccountGroupId } from '../../../selectors/multichain-accounts/account-tree';
import { SideNavAccountAddress } from './side-nav-account-address';

/**
 * Account row for the fullscreen side navigation.
 *
 * The balance sits in the subtitle. When the show-default-address preference
 * is on, the scoped default address follows it; otherwise the wallet name
 * passed by the list does, matching the shared account cell. The menu is
 * hidden until the row is hovered, and stays visible while its popover is open.
 *
 * @param props
 * @param props.accountId
 * @param props.accountName
 * @param props.accountNameString
 * @param props.onClick
 * @param props.balance
 * @param props.selected
 * @param props.walletName
 * @param props.privacyMode
 * @param props.showDefaultAddress
 * @param props.pending
 * @param props.endAccessory
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

  const handleClick = () => {
    if (pending || !onClick) {
      return;
    }
    onClick(accountId);
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
      className={`group/account-cell flex w-full min-w-0 items-center gap-4 p-4 text-left transition-colors duration-200 hover:bg-background-default-hover ${cursorClass}${
        selected ? ' bg-background-muted' : ''
      }${pending ? ' opacity-60' : ''}`}
      onClick={handleClick}
      data-testid={`side-nav-account-cell-${accountId}`}
      aria-busy={pending || undefined}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center"
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
              {balance ? (
                <SensitiveText
                  data-testid="side-nav-account-cell-balance"
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                  ellipsis
                  isHidden={privacyMode}
                  className="shrink-0"
                >
                  {balance}
                </SensitiveText>
              ) : null}
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {endAccessory ? (
        <div
          className="flex shrink-0 items-center justify-end opacity-0 pointer-events-none group-hover/account-cell:pointer-events-auto group-hover/account-cell:opacity-100 has-[[aria-expanded=true]]:pointer-events-auto has-[[aria-expanded=true]]:opacity-100"
          data-testid="side-nav-account-cell-menu"
          aria-label={`${ariaLabelName} options`}
        >
          {endAccessory}
        </div>
      ) : null}
    </div>
  );
};
