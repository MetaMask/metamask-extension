import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const WalletOverview = ({ balance, buttons, className, icon, loading }) => {
  return (
    <div className={classnames('wallet-overview', className)}>
      <div className="wallet-overview__balance">
        {loading ? null : icon}
        {balance}
      </div>
      <div className="wallet-overview__buttons">{buttons}</div>
    </div>
  );
};

WalletOverview.propTypes = {
  balance: PropTypes.element.isRequired,
  buttons: PropTypes.element.isRequired,
  className: PropTypes.string,
  icon: PropTypes.element.isRequired,
  loading: PropTypes.boolean,
};

WalletOverview.defaultProps = {
  className: undefined,
};

export default WalletOverview;
