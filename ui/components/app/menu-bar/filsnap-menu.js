import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { reinstallFilsnap, toggleFilsnap } from '../../../store/actions';
import { Menu, MenuItem } from '../../ui/menu';
import { isFilsnapRunning } from '../../../selectors';

export default function FilsnapMenu({ anchorElement, onClose }) {
  const isRunning = useSelector(isFilsnapRunning);
  const [pendingAction, setPendingAction] = useState(false);

  return (
    <Menu
      anchorElement={anchorElement}
      className="filsnap-menu"
      onHide={onClose}
    >
      <MenuItem
        data-testid="filsnap-menu__item"
        onClick={async () => {
          if (!pendingAction) {
            setPendingAction(true);
            await toggleFilsnap();
            setPendingAction(false);
          }
        }}
        iconClassName="fas fa-power-off"
      >
        {isRunning ? 'Stop' : 'Start'}
      </MenuItem>
      <MenuItem
        data-testid="filsnap-menu__item"
        onClick={async () => {
          if (!pendingAction) {
            setPendingAction(true);
            await reinstallFilsnap();
            setPendingAction(false);
          }
        }}
        iconClassName="fas fa-recycle"
      >
        Reinstall Filsnap
      </MenuItem>
    </Menu>
  );
}

FilsnapMenu.propTypes = {
  anchorElement: PropTypes.instanceOf(window.Element).isRequired,
  onClose: PropTypes.func.isRequired,
};
