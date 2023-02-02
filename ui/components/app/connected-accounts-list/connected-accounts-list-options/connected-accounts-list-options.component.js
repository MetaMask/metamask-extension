import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { Menu } from '../../../ui/menu';
import { ButtonIcon, ICON_NAMES } from '../../../component-library';

const ConnectedAccountsListOptions = ({
  children,
  onShowOptions,
  onHideOptions,
  show,
}) => {
  const ref = useRef(false);

  return (
    <div ref={ref}>
      <ButtonIcon
        iconName={ICON_NAMES.MORE_VERTICAL}
        className="connected-accounts-options__button"
        onClick={onShowOptions}
      />
      {show ? (
        <Menu
          anchorElement={ref.current}
          onHide={onHideOptions}
          popperOptions={{
            modifiers: [
              { name: 'preventOverflow', options: { altBoundary: true } },
            ],
          }}
        >
          {children}
        </Menu>
      ) : null}
    </div>
  );
};

ConnectedAccountsListOptions.propTypes = {
  children: PropTypes.node.isRequired,
  onHideOptions: PropTypes.func.isRequired,
  onShowOptions: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default ConnectedAccountsListOptions;
