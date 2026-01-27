import React, { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
  IconName,
  ModalFocus,
  Popover,
  PopoverPosition,
  PopoverRole,
  Text,
} from '../../component-library';
import { MenuItem } from '../../ui/menu';
import { IconColor, TextColor } from '../../../helpers/constants/design-system';

export const NetworkListItemMenu = ({
  anchorElement,
  onClose,
  onEditClick,
  onDeleteClick,
  onDiscoverClick,
  isOpen,
  finalFocusRef,
  isClosing: isClosingProp,
}) => {
  const t = useI18nContext();

  const popoverDialogRef = useRef(null);

  const getLastMenuItem = useCallback(() => {
    if (!popoverDialogRef.current) {
      return null;
    }
    const menuItems =
      popoverDialogRef.current.querySelectorAll('button.menu-item');
    return menuItems.length > 0 ? menuItems[menuItems.length - 1] : null;
  }, []);

  // Handle Tab key press for accessibility - close popover on last MenuItem
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Tab') {
        const lastMenuItem = getLastMenuItem();
        if (event.target === lastMenuItem) {
          // If Tab is pressed at the last item, close popover and focus to next element in DOM
          onClose();
        }
      }
    },
    [onClose, getLastMenuItem],
  );

  const menuContent = (
    <div onKeyDown={handleKeyDown} ref={popoverDialogRef}>
      <Box>
        {onDiscoverClick ? (
          <MenuItem
            iconName={IconName.Eye}
            onClick={(e) => {
              e.stopPropagation();
              onDiscoverClick();
            }}
            data-testid="network-list-item-options-discover"
          >
            <Text>{t('discover')}</Text>
          </MenuItem>
        ) : null}
        {onEditClick ? (
          <MenuItem
            iconName={IconName.Edit}
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            data-testid="network-list-item-options-edit"
          >
            <Text> {t('edit')}</Text>
          </MenuItem>
        ) : null}
        {onDeleteClick ? (
          <MenuItem
            iconName={IconName.Trash}
            iconColor={IconColor.errorDefault}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick();
            }}
            data-testid="network-list-item-options-delete"
          >
            <Text color={TextColor.errorDefault}>{t('delete')}</Text>
          </MenuItem>
        ) : null}
      </Box>
    </div>
  );

  return (
    <Popover
      className="multichain-network-list-item-menu__popover"
      onClickOutside={onClose}
      referenceElement={anchorElement}
      role={PopoverRole.Dialog}
      position={PopoverPosition.BottomEnd}
      offset={[8, 0]}
      padding={0}
      isOpen={isOpen}
      isPortal
      preventOverflow
      flip
    >
      {isClosingProp ? (
        // When closing, render without ModalFocus to prevent focus management
        menuContent
      ) : (
        <ModalFocus
          restoreFocus={!finalFocusRef}
          autoFocus={false}
          finalFocusRef={finalFocusRef}
        >
          {menuContent}
        </ModalFocus>
      )}
    </Popover>
  );
};

NetworkListItemMenu.propTypes = {
  /**
   * Element that the menu should display next to
   */
  anchorElement: PropTypes.instanceOf(window.Element),
  /**
   * Function that executes when the menu is closed
   */
  onClose: PropTypes.func.isRequired,
  /**
   * Function that executes when the Edit menu item is clicked
   */
  onEditClick: PropTypes.func,
  /**
   * Function that executes when the Delete menu item is closed
   */
  onDeleteClick: PropTypes.func,
  /**
   * Function that executes when the Discover menu item is clicked
   */
  onDiscoverClick: PropTypes.func,
  /**
   * Represents if the menu is open or not
   *
   * @type {boolean}
   */
  isOpen: PropTypes.bool.isRequired,
  /**
   * Ref of the element that should receive focus when the menu closes
   */
  finalFocusRef: PropTypes.shape({
    current: PropTypes.instanceOf(window.Element),
  }),
  /**
   * Indicates if the menu is currently closing (used to prevent focus management)
   */
  isClosing: PropTypes.bool,
};
