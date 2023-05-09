import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { getSelectedIdentity } from '../../../selectors';
import { AddressCopyButton } from '../../multichain';
import Box from '../../ui/box/box';
import FoxIcon from '../../ui/fox-icon/FoxIcon';
import { FOX_COLOR_PALETTE } from '../../../helpers/utils/generative-color';

const WalletOverview = ({ balance, buttons, className, icon, loading }) => {
  const selectedIdentity = useSelector(getSelectedIdentity);
  const checksummedAddress = toChecksumHexAddress(selectedIdentity?.address);
  return (
    <div className={classnames('wallet-overview', className)}>
      <div className="wallet-overview__balance">
        {process.env.MULTICHAIN ? (
          <Box marginTop={2}>
            <AddressCopyButton address={checksummedAddress} shorten />
          </Box>
        ) : (
          <>{loading ? null : icon}</>
        )}
        {balance}
      </div>
      <div className="wallet-overview__buttons">{buttons}</div>
      <FoxIcon colorSchema={FOX_COLOR_PALETTE} />
    </div>
  );
};

WalletOverview.propTypes = {
  balance: PropTypes.element.isRequired,
  buttons: PropTypes.element.isRequired,
  className: PropTypes.string,
  icon: PropTypes.element.isRequired,
  loading: PropTypes.bool,
};

WalletOverview.defaultProps = {
  className: undefined,
};

export default WalletOverview;
