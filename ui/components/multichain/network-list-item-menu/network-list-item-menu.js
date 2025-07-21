import React from 'react';
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
}) => {
  const t = useI18nContext();

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
      <ModalFocus restoreFocus initialFocusRef={anchorElement}>
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
   * Function that executes when the Discover menu item is clicked
   */
  onDiscoverClick: PropTypes.func,
  /**
   * Represents if the menu is open or not
   *
   * @type {boolean}
   */
  isOpen: PropTypes.bool.isRequired,
};
