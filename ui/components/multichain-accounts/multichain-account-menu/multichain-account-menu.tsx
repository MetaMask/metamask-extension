import React, { useCallback, useContext, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Icon,
  IconName,
  ModalFocus,
  Popover,
  PopoverPosition,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  JustifyContent,
  TextColor,
} from '../../../helpers/constants/design-system';
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
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
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
  const trackEvent = useContext(MetaMetricsContext);

  // Get the account group metadata to check pinned/hidden state
  const accountGroupMetadata = useMemo(() => {
    const { wallets } = accountTree;
    for (const wallet of Object.values(wallets)) {
      const group = wallet.groups?.[accountGroupId];
      if (group) {
        return group.metadata;
      }
    }
    return null;
  }, [accountTree, accountGroupId]);

  const isPinned = accountGroupMetadata?.pinned ?? false;
  const isHidden = accountGroupMetadata?.hidden ?? false;

  // Helper function to count pinned/hidden accounts from the account tree
  const countAccountsByStatus = useCallback(
    (status: 'pinned' | 'hidden', newValue: boolean): number => {
      let count = 0;
      const { wallets } = accountTree;
      for (const wallet of Object.values(wallets)) {
        for (const [groupId, group] of Object.entries(wallet.groups || {})) {
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
    const handleAccountDetailsClick = (mouseEvent: React.MouseEvent) => {
      mouseEvent.stopPropagation();
      const multichainAccountDetailsPageRoute = `${MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE}/${encodeURIComponent(accountGroupId)}`;
      navigate(multichainAccountDetailsPageRoute);
    };

    const handleAccountRenameClick = (mouseEvent: React.MouseEvent) => {
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();
      if (handleAccountRenameAction) {
        handleAccountRenameAction(accountGroupId);
      }
    };

    const handleAccountAddressesClick = (mouseEvent: React.MouseEvent) => {
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();
      trace({
        name: TraceName.ShowAccountAddressList,
        op: TraceOperation.AccountUi,
      });
      const multichainAccountAddressesPageRoute = `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(accountGroupId)}`;
      navigate(multichainAccountAddressesPageRoute);
    };

    const handleAccountPinClick = async (mouseEvent: React.MouseEvent) => {
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();

      const newPinnedState = !isPinned;

      // If account is hidden, unhide it first before pinning
      if (isHidden) {
        await dispatch(setAccountGroupHidden(accountGroupId, false));
      }

      await dispatch(setAccountGroupPinned(accountGroupId, newPinnedState));

      // Track the Account Pinned event
      trackEvent({
        event: MetaMetricsEventName.AccountPinned,
        category: MetaMetricsEventCategory.Accounts,
        properties: {
          pinned: newPinnedState,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          pinned_count_after: countAccountsByStatus('pinned', newPinnedState),
        },
      });

      onToggle?.();
    };

    const handleAccountHideClick = async (mouseEvent: React.MouseEvent) => {
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();

      const newHiddenState = !isHidden;

      // If account is pinned, unpin it first before hiding
      if (isPinned) {
        await dispatch(setAccountGroupPinned(accountGroupId, false));
      }

      await dispatch(setAccountGroupHidden(accountGroupId, newHiddenState));

      // Track the Account Hidden event
      trackEvent({
        event: MetaMetricsEventName.AccountHidden,
        category: MetaMetricsEventCategory.Accounts,
        properties: {
          hidden: newHiddenState,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hidden_count_after: countAccountsByStatus('hidden', newHiddenState),
        },
      });

      onToggle?.();
    };

    const handleAccountRemoveClick = (mouseEvent: React.MouseEvent) => {
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
      {
        textKey: isHidden ? 'showAccount' : 'hideAccount',
        iconName: isHidden ? IconName.Eye : IconName.EyeSlash,
        onClick: handleAccountHideClick,
      },
    ];

    if (isRemovable) {
      baseMenuItems.push({
        textKey: 'remove',
        iconName: IconName.Trash,
        onClick: handleAccountRemoveClick,
        textColor: TextColor.errorDefault,
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
    dispatch,
    onToggle,
    trackEvent,
    countAccountsByStatus,
  ]);

  return (
    <>
      <Box
        className="multichain-account-cell-popover-menu-button"
        ref={popoverRef}
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        backgroundColor={
          buttonBackgroundColor || BackgroundColor.backgroundMuted
        }
        borderRadius={BorderRadius.LG}
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
