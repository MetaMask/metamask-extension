import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  checkNetworkAndAccountSupports1559,
  txDataSelector,
} from '../../../selectors';
import GasDetailsItem from '../gas-details-item';
import { isLegacyTransaction } from '../../../helpers/utils/transactions.util';
import ConfirmLegacyGasDisplay from './confirm-legacy-gas-display';

const ConfirmGasDisplay = ({ userAcknowledgedGasMissing = false }) => {
  const { txParams } = useSelector((state) => txDataSelector(state));
  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const isLegacyTxn = isLegacyTransaction(txParams);
  const supportsEIP1559 = networkAndAccountSupports1559 && !isLegacyTxn;
  return supportsEIP1559 ? (
    <GasDetailsItem userAcknowledgedGasMissing={userAcknowledgedGasMissing} />
  ) : (
    <ConfirmLegacyGasDisplay />
  );
};

ConfirmGasDisplay.propTypes = {
  userAcknowledgedGasMissing: PropTypes.bool,
};

export default ConfirmGasDisplay;
