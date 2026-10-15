import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { Menu } from '../../../ui/menu';
import { IconName, ButtonIcon } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const ConnectedAccountsListOptions = ({
  children,
  onShowOptions,
  onHideOptions,
  show,
}) => {
  const [anchorElement, setAnchorElement] = useState(null);
  const setAnchorRef = useCallback((node) => {
    setAnchorElement(node);
  }, []);
  const t = useI18nContext();

  return (
    <div ref={setAnchorRef}>
      <ButtonIcon
        iconName={IconName.MoreVertical}
        className="connected-accounts-options__button"
        onClick={onShowOptions}
        ariaLabel={t('options')}
      />
      {show ? (
        <Menu
          anchorElement={anchorElement}
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
