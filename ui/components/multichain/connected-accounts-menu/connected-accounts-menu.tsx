import React, { useRef, useCallback, useEffect } from 'react';
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
import { getOriginOfCurrentTab } from '../../../selectors';
import { Identity } from './connected-accounts-menu.types';

const TsMenuItem = MenuItem as any;

export const ConnectedAccountsMenu = ({
  isOpen,
  identity,
  anchorElement,
  disableAccountSwitcher = false,
  onClose,
  closeMenu,
}: {
  isOpen: boolean;
  identity: Identity;
  anchorElement: HTMLElement | null;
  disableAccountSwitcher: boolean;
  onClose: () => void;
  closeMenu: () => void;
}) => {
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const dispatch = useDispatch();
  const t = useI18nContext();
  const popoverDialogRef = useRef<HTMLDivElement | null>(null);

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
          >
            <Text variant={TextVariant.bodyMd}>{t('permissionDetails')}</Text>
          </TsMenuItem>
          {disableAccountSwitcher ? null : (
            <TsMenuItem
              iconName={IconName.SwapHorizontal}
              data-testid="switch-account-menu-item"
              onClick={() => {
                dispatch(setSelectedAccount(identity.address));
                onClose();
                closeMenu();
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
              dispatch(
                removePermittedAccount(activeTabOrigin, identity.address),
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
  );
};
