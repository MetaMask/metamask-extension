import React, { useMemo, useRef } from 'react';
import { useHistory } from 'react-router-dom';
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
import { MultichainAccountMenuProps } from './multichain-account-menu.types';

export const MultichainAccountMenu = ({
  accountGroupId,
  isRemovable,
  buttonBackgroundColor,
  handleAccountRenameAction,
  isOpen = false,
  onToggle,
}: MultichainAccountMenuProps) => {
  const history = useHistory();
  const popoverRef = useRef<HTMLDivElement>(null);

  const togglePopover = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onToggle?.();
  };

  const menuConfig = useMemo(() => {
    const handleAccountDetailsClick = (mouseEvent: React.MouseEvent) => {
      mouseEvent.stopPropagation();
      const multichainAccountDetailsPageRoute = `${MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE}/${encodeURIComponent(accountGroupId)}`;
      history.push(multichainAccountDetailsPageRoute);
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
      const multichainAccountAddressesPageRoute = `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(accountGroupId)}`;
      history.push(multichainAccountAddressesPageRoute);
    };

    const handleAccountPinClick = (mouseEvent: React.MouseEvent) => {
      // TODO: Implement account pin click handling
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();
    };

    const handleAccountHideClick = (mouseEvent: React.MouseEvent) => {
      // TODO: Implement account hide click handling
      mouseEvent.stopPropagation();
      mouseEvent.preventDefault();
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
        textKey: 'pin',
        iconName: IconName.Pin,
        onClick: handleAccountPinClick,
        disabled: true,
      },
      {
        textKey: 'hide',
        iconName: IconName.EyeSlash,
        onClick: handleAccountHideClick,
        disabled: true,
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
  }, [accountGroupId, handleAccountRenameAction, history, isRemovable]);

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
