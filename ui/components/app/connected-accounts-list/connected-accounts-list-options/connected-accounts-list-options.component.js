import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { Menu } from '../../../ui/menu';
import { ICON_NAMES } from '../../../component-library/icon/deprecated';
import { ButtonIcon } from '../../../component-library/button-icon/deprecated';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const ConnectedAccountsListOptions = ({
  children,
  onShowOptions,
  onHideOptions,
  show,
}) => {
  const ref = useRef(false);
  const t = useI18nContext();

  return (
    <div ref={ref}>
      <ButtonIcon
        iconName={ICON_NAMES.MORE_VERTICAL}
        className="connected-accounts-options__button"
        onClick={onShowOptions}
        ariaLabel={t('options')}
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
