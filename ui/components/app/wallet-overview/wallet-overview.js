import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

// TODO: Move this function to shared
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';

const WalletOverview = ({ balance, buttons, className }) => {
  const overviewClasses = ['wallet-overview'];
  if (getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN) {
    overviewClasses.push('wallet-overview-fullscreen');
  }

  return (
    <div className={classnames(...overviewClasses, className)}>
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
