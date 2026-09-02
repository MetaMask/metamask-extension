import React, { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

import { TextVariant } from '@metamask/design-system-react';
import { useEventListener } from '../../../hooks/useEventListener';

import {
  ModalFocus,
  Popover,
  PopoverPosition,
  PopoverRole,
} from '../../component-library';
import { AccountDetailsMenuItem, ViewExplorerMenuItem } from '../menu-items';

const METRICS_LOCATION = 'Account Options';

export const AccountListItemMenu = ({
  anchorElement,
  onClose,
  closeMenu,
  account,
  isOpen,
  isRemovable: _isRemovable, // Accepted for API compatibility; remove-account action is no longer shown
}) => {
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

  useEventListener('mousedown', handleClickOutside);

  return (
    <Popover
      className="multichain-account-list-item-menu__popover"
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
        <div ref={popoverDialogRef}>
          <AccountDetailsMenuItem
            metricsLocation={METRICS_LOCATION}
            closeMenu={closeMenu}
            address={account.address}
            textProps={{ variant: TextVariant.BodySm }}
          />
          <ViewExplorerMenuItem
            metricsLocation={METRICS_LOCATION}
            closeMenu={closeMenu}
            textProps={{ variant: TextVariant.BodySm }}
            account={account}
          />
        </div>
      </ModalFocus>
    </Popover>
  );
};

AccountListItemMenu.propTypes = {
  /**
   * Element that the menu should display next to
   */
  anchorElement: PropTypes.instanceOf(window.Element),
  /**
   * Function that executes when the menu is closed
   */
  onClose: PropTypes.func.isRequired,
  /**
   * Represents if the menu is open or not
   *
   * @type {boolean}
   */
  isOpen: PropTypes.bool.isRequired,
  /**
   * Function that closes the menu
   */
  closeMenu: PropTypes.func,
  /**
   * Accepted for API compatibility; remove-account action is no longer shown
   */
  isRemovable: PropTypes.bool,
  /**
   * An account object that has name, address, and balance data
   */
  account: PropTypes.shape({
    id: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired,
    metadata: PropTypes.shape({
      name: PropTypes.string.isRequired,
      snap: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
        enabled: PropTypes.bool,
      }),
      keyring: PropTypes.shape({
        type: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};
