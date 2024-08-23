import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  PopoverRole,
  PopoverPosition,
  Popover,
  IconName,
  Text,
  ModalFocus,
  Box,
} from '../../../../component-library';
import { MenuItem } from '../../../../ui/menu';
import {
  IconColor,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getPermissionsForActiveTab } from '../../../../../selectors';
import { PermissionDetailsModal } from '../../../permission-details-modal/permission-details-modal';

// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TsMenuItem = MenuItem as any;

export const SiteCellMenu = ({
  isOpen,
  account,
  anchorElement,
  disableAccountSwitcher = false,
  onClose,
  closeMenu,
  onActionClick,
  activeTabOrigin,
}: {
  isOpen: boolean;
  anchorElement: HTMLElement | null;
  disableAccountSwitcher: boolean;
  onClose: () => void;
  closeMenu: () => void;
  onActionClick: (message: string) => void;
  activeTabOrigin: string;
}) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const popoverDialogRef = useRef<HTMLDivElement | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const permissions = useSelector(getPermissionsForActiveTab);

  const handleClickOutside = useCallback(
    (event) => {
      if (
        popoverDialogRef?.current &&
        !popoverDialogRef.current.contains(event.target)
      ) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleKeyDown = useCallback(
    (event) => {
      if (
        event.key === 'Tab' &&
        popoverDialogRef?.current?.contains(event.target) &&
        onClose
      ) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <>
      <Popover
        className="multichain-connected-accounts-menu__popover"
        referenceElement={anchorElement}
        role={PopoverRole.Dialog}
        position={PopoverPosition.Bottom}
        offset={[0, 0]}
        padding={0}
        isOpen={isOpen}
        flip
        preventOverflow
        isPortal
      >
        <ModalFocus restoreFocus initialFocusRef={{ current: anchorElement }}>
          <Box onKeyDown={handleKeyDown} ref={popoverDialogRef}>
              <TsMenuItem
                iconName={IconName.SecurityTick}
                data-testid="permission-details-menu-item"
                onClick={() => {
                  setShowPermissionModal(true);
                  onClose();
                }}
              >
                <Text variant={TextVariant.bodyMd}>
                  {t('permissionDetails')}
                </Text>
              </TsMenuItem>
          </Box>
        </ModalFocus>
      </Popover>
    </>
  );
};
