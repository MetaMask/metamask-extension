import React, { useCallback, useContext, useMemo, useRef } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxJustifyContent,
  Icon,
  IconName,
  TextColor,
} from '@metamask/design-system-react';
import { ModalFocus, Popover, PopoverPosition } from '../../component-library';
import { BorderRadius } from '../../../helpers/constants/design-system';
import {
  MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE,
  MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
import { MultichainAccountMenuItems } from '../multichain-account-menu-items/multichain-account-menu-items';
import { MenuItemConfig } from '../multichain-account-menu-items/multichain-account-menu-items.types';
import {
  setAccountGroupPinned,
  setAccountGroupHidden,
} from '../../../store/actions';
import { getAccountTree } from '../../../selectors/multichain-accounts/account-tree';
import { trace, TraceName, TraceOperation } from '../../../../shared/lib/trace';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { isPrivateKeyWallet } from '../../../helpers/utils/account-wallet';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useDisconnectAccountGroup } from '../../../hooks/useDisconnectAccountGroup';
import { useDispatch } from '../../../store/hooks';
import { MultichainAccountMenuProps } from './multichain-account-menu.types';

export const MultichainAccountMenu = ({
  accountGroupId,
  isRemovable,
  buttonBackgroundColor,
  handleAccountRenameAction,
  isOpen = false,
  onToggle,
}: MultichainAccountMenuProps) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const popoverRef = useRef<HTMLDivElement>(null);
  const accountTree = useSelector(getAccountTree);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const disconnectAccountGroup = useDisconnectAccountGroup();

  // Get the wallet holding the account group, both for the group's pinned and
  // hidden state and to know which actions the account supports
  const accountWallet = useMemo(() => {
    const { wallets } = accountTree;
    return (
      Object.values(wallets).find((wallet) =>
        Boolean(wallet.groups?.[accountGroupId]),
      ) ?? null
    );
  }, [accountTree, accountGroupId]);

  const accountGroupMetadata =
    accountWallet?.groups?.[accountGroupId]?.metadata ?? null;

  const isPinned = accountGroupMetadata?.pinned ?? false;
  const isHidden = accountGroupMetadata?.hidden ?? false;
  // An imported private key account is removed rather than hidden, and hiding
  // it would leave the user without a way to bring it back.
  const isHideable = !accountWallet || !isPrivateKeyWallet(accountWallet);

  // Helper function to count pinned/hidden accounts from the account tree
  const countAccountsByStatus = useCallback(
    (status: 'pinned' | 'hidden', newValue: boolean): number => {
      let count = 0;
      const { wallets } = accountTree;
      for (const wallet of Object.values(wallets)) {
        for (const [groupId, group] of Object.entries(wallet.groups)) {
          if (groupId === accountGroupId) {
            // Use the new value for the current account
            if (newValue) {
              count += 1;
            }
          } else if (group.metadata?.[status]) {
            count += 1;
          }
        }
      }
      return count;
    },
    [accountTree, accountGroupId],
  );

  const togglePopover = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onToggle?.();
  };

  const menuConfig = useMemo(() => {
    const handleAccountDetailsClick = (
      mouseEvent: React.MouseEvent<HTMLDivElement>,
    ) => {
      mouseEvent.stopPropagation();

      navigate({
        pathname: MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
        search: createSearchParams({
          accountGroupId,
        }).toString(),
      });
    };

    const handleAccountRenameClick = (
      mouseEvent: React.MouseEvent<HTMLDivElement>,
    ) => {
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();
      if (handleAccountRenameAction) {
        handleAccountRenameAction(accountGroupId);
      }
    };

    const handleAccountAddressesClick = (
      mouseEvent: React.MouseEvent<HTMLDivElement>,
    ) => {
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();
      trace({
        name: TraceName.ShowAccountAddressList,
        op: TraceOperation.AccountUi,
      });
      const multichainAccountAddressesPageRoute = `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}?accountGroupId=${encodeURIComponent(accountGroupId)}`;
      navigate(multichainAccountAddressesPageRoute);
    };

    const handleAccountPinClick = async (
      mouseEvent: React.MouseEvent<HTMLDivElement>,
    ) => {
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();

      const newPinnedState = !isPinned;

      // If account is hidden, unhide it first before pinning
      if (isHidden) {
        await dispatch(setAccountGroupHidden(accountGroupId, false));
      }

      await dispatch(setAccountGroupPinned(accountGroupId, newPinnedState));

      // Track the Account Pinned event
      trackEvent(
        createEventBuilder(MetaMetricsEventName.AccountPinned)
          .addCategory(MetaMetricsEventCategory.Accounts)
          .addProperties({
            pinned: newPinnedState,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            pinned_count_after: countAccountsByStatus('pinned', newPinnedState),
          })
          .build(),
      );

      onToggle?.();
    };

    const handleAccountHideClick = async (
      mouseEvent: React.MouseEvent<HTMLDivElement>,
    ) => {
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();

      const newHiddenState = !isHidden;

      // If account is pinned, unpin it first before hiding
      if (isPinned) {
        await dispatch(setAccountGroupPinned(accountGroupId, false));
      }

      if (newHiddenState) {
        // A hidden account cannot be managed from the list, so leaving it
        // connected would strand dapp permissions out of the user's reach.
        await disconnectAccountGroup(accountGroupId);
      }

      await dispatch(setAccountGroupHidden(accountGroupId, newHiddenState));

      // Track the Account Hidden event
      trackEvent(
        createEventBuilder(MetaMetricsEventName.AccountHidden)
          .addCategory(MetaMetricsEventCategory.Accounts)
          .addProperties({
            hidden: newHiddenState,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hidden_count_after: countAccountsByStatus('hidden', newHiddenState),
          })
          .build(),
      );

      onToggle?.();
    };

    const handleAccountRemoveClick = (
      mouseEvent: React.MouseEvent<HTMLDivElement>,
    ) => {
      // TODO: Implement account remove click handling
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();
    };

    const baseMenuItems: MenuItemConfig[] = [
      {
        textKey: 'accountDetails',
        iconName: IconName.Details,
        onClick: handleAccountDetailsClick,
      },
      {
        textKey: 'rename',
        iconName: IconName.Edit,
        onClick: handleAccountRenameClick,
      },
      {
        textKey: 'addresses',
        iconName: IconName.QrCode,
        onClick: handleAccountAddressesClick,
      },
      {
        textKey: isPinned ? 'unpin' : 'pinToTop',
        iconName: isPinned ? IconName.Unpin : IconName.Pin,
        onClick: handleAccountPinClick,
      },
    ];

    if (isHideable) {
      baseMenuItems.push({
        textKey: isHidden ? 'showAccount' : 'hideAccount',
        iconName: isHidden ? IconName.Eye : IconName.EyeSlash,
        onClick: handleAccountHideClick,
      });
    }

    if (isRemovable) {
      baseMenuItems.push({
        textKey: 'remove',
        iconName: IconName.Trash,
        onClick: handleAccountRemoveClick,
        textColor: TextColor.ErrorDefault,
      });
    }

    return baseMenuItems;
  }, [
    accountGroupId,
    handleAccountRenameAction,
    navigate,
    isRemovable,
    isPinned,
    isHidden,
    isHideable,
    dispatch,
    disconnectAccountGroup,
    onToggle,
    trackEvent,
    countAccountsByStatus,
  ]);

  return (
    <>
      <Box
        className="flex multichain-account-cell-popover-menu-button rounded-lg"
        ref={popoverRef}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        backgroundColor={
          buttonBackgroundColor ?? BoxBackgroundColor.BackgroundMuted
        }
        padding={1}
        onClick={togglePopover}
      >
        <Icon
          className="multichain-account-cell-popover-menu-button-icon"
          name={IconName.MoreVertical}
        />
      </Box>
      <Popover
        className="multichain-account-cell-popover-menu"
        isOpen={isOpen}
        position={PopoverPosition.LeftStart}
        referenceElement={popoverRef.current}
        matchWidth={false}
        borderRadius={BorderRadius.LG}
        isPortal
        flip
        onClickOutside={onToggle}
      >
        <ModalFocus restoreFocus initialFocusRef={popoverRef}>
          <MultichainAccountMenuItems menuConfig={menuConfig} />
        </ModalFocus>
      </Popover>
    </>
  );
};
