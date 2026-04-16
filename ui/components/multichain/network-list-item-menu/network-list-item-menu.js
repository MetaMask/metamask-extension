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

  // Create refs for each menu item
  const discoverRef = useRef(null);
  const editRef = useRef(null);
  const deleteRef = useRef(null);

  // Determine which menu item is last based on what's rendered
  const getLastMenuItemRef = useCallback(() => {
    if (onDeleteClick) {
      return deleteRef;
    }
    if (onEditClick) {
      return editRef;
    }
    if (onDiscoverClick) {
      return discoverRef;
    }
    return null;
  }, [onDeleteClick, onEditClick, onDiscoverClick]);

  // Handle Tab key press for accessibility - close popover on last MenuItem
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Tab') {
        const lastMenuItemRef = getLastMenuItemRef();
        if (
          lastMenuItemRef?.current &&
          event.target === lastMenuItemRef.current
        ) {
          // If Tab is pressed at the last item, close popover and focus to next element in DOM
          onClose();
        }
      }
    },
    [onClose, getLastMenuItemRef],
  );

  const menuContent = (
    <div onKeyDown={handleKeyDown}>
      <Box>
        {onDiscoverClick ? (
          <MenuItem
            ref={discoverRef}
            iconNameLegacy={IconName.Eye}
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
            ref={editRef}
            iconNameLegacy={IconName.Edit}
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
            ref={deleteRef}
            iconNameLegacy={IconName.Trash}
            iconColorLegacy={IconColor.errorDefault}
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
