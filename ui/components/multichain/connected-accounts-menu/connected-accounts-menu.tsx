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
} from '../../component-library';
import { MenuItem } from '../../ui/menu';
import {
  IconColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  removePermittedAccount,
  setSelectedAccount,
} from '../../../store/actions';
import { getPermissionsForActiveTab } from '../../../selectors';
import { PermissionDetailsModal } from '../permission-details-modal/permission-details-modal';
import { Identity } from './connected-accounts-menu.types';

// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TsMenuItem = MenuItem as any;

export const ConnectedAccountsMenu = ({
  isOpen,
  account,
  anchorElement,
  disableAccountSwitcher = false,
  onClose,
  onActionClick,
  activeTabOrigin,
}: {
  isOpen: boolean;
  account: Identity;
  anchorElement: HTMLElement | null;
  disableAccountSwitcher: boolean;
  onClose: () => void;
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
            {permissions?.length ? (
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
            ) : null}
            {disableAccountSwitcher ? null : (
              <TsMenuItem
                iconName={IconName.SwapHorizontal}
                data-testid="switch-account-menu-item"
                onClick={() => {
                  dispatch(setSelectedAccount(account.address));
                  onClose();
                }}
              >
                <Text variant={TextVariant.bodyMd}>
                  {t('switchToThisAccount')}
                </Text>
              </TsMenuItem>
            )}
            <TsMenuItem
              iconName={IconName.Logout}
              iconColor={IconColor.errorDefault}
              data-testid="disconnect-menu-item"
              onClick={() => {
                onActionClick(account.metadata.name);
                dispatch(
                  removePermittedAccount(activeTabOrigin, account.address),
                );
              }}
            >
              <Text color={TextColor.errorDefault} variant={TextVariant.bodyMd}>
                {t('disconnect')}
              </Text>
            </TsMenuItem>
          </Box>
        </ModalFocus>
      </Popover>
      {showPermissionModal ? (
        <PermissionDetailsModal
          isOpen={showPermissionModal}
          account={account}
          onClick={() => {
            dispatch(removePermittedAccount(activeTabOrigin, account.address));
          }}
          onClose={() => setShowPermissionModal(false)}
          permissions={permissions}
        />
      ) : null}
    </>
  );
};
