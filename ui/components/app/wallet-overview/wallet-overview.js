import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'clsx';

import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';

const WalletOverview = ({ balance, buttons, className }) => {
  const environmentType = getEnvironmentType();

  return (
    <div
      className={classnames(
        'wallet-overview',
        {
          'wallet-overview-fullscreen':
            environmentType === ENVIRONMENT_TYPE_FULLSCREEN ||
            environmentType === ENVIRONMENT_TYPE_SIDEPANEL,
        },
        className,
      )}
    >
      <div className="wallet-overview__balance">{balance}</div>
      <div className="wallet-overview__buttons">{buttons}</div>
    </div>
  );
};

WalletOverview.propTypes = {
  balance: PropTypes.element.isRequired,
  buttons: PropTypes.element.isRequired,
  className: PropTypes.string,
};

export default WalletOverview;
