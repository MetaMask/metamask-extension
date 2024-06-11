import React, { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
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
  isOpen,
}) => {
  const t = useI18nContext();

  // Handle Tab key press for accessibility inside the popover and will close the popover on the last MenuItem
  const lastItemRef = useRef(null);
  const accountDetailsItemRef = useRef(null);
  const removeAccountItemRef = useRef(null);
  const removeJWTItemRef = useRef(null);

  // Checks the MenuItems from the bottom to top to set lastItemRef on the last MenuItem that is not disabled
  useEffect(() => {
    if (removeJWTItemRef.current) {
      lastItemRef.current = removeJWTItemRef.current;
    } else if (removeAccountItemRef.current) {
      lastItemRef.current = removeAccountItemRef.current;
    } else {
      lastItemRef.current = accountDetailsItemRef.current;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    removeJWTItemRef.current,
    removeAccountItemRef.current,
    accountDetailsItemRef.current,
  ]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Tab' && event.target === lastItemRef.current) {
        // If Tab is pressed at the last item to close popover and focus to next element in DOM
        onClose();
      }
    },
    [onClose],
  );

  // Handle click outside of the popover to close it
  const popoverDialogRef = useRef(null);

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

  return (
    <Popover
      className="multichain-network-list-item-menu__popover"
      referenceElement={anchorElement}
      role={PopoverRole.Dialog}
      position={PopoverPosition.Bottom}
      offset={[0, 0]}
      padding={0}
      isOpen={isOpen}
      isPortal
      preventOverflow
      flip
    >
      <ModalFocus restoreFocus initialFocusRef={anchorElement}>
        <div onKeyDown={handleKeyDown} ref={popoverDialogRef}>
          {onEditClick ? (
            <MenuItem
              iconName={IconName.Edit}
              onClick={(e) => {
                e.stopPropagation();

                // Pass network info?
                onEditClick();
              }}
              data-testid="network-list-item-options-edit"
            >
              {t('edit')}
            </MenuItem>
          ) : null}
          {onDeleteClick ? (
            <MenuItem
              iconName={IconName.Trash}
              iconColor={IconColor.errorDefault}
              onClick={(e) => {
                e.stopPropagation();

                // Pass network info?
                onDeleteClick();
              }}
              data-testid="network-list-item-options-delete"
            >
              <Text color={TextColor.errorDefault}>{t('delete')}</Text>
            </MenuItem>
          ) : null}
        </div>
      </ModalFocus>
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
   * Represents if the menu is open or not
   *
   * @type {boolean}
   */
  isOpen: PropTypes.bool.isRequired,
};
