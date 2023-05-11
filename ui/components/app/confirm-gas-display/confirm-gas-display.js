import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import {
  checkNetworkAndAccountSupports1559,
  txDataSelector,
} from '../../../selectors';
import { isLegacyTransaction } from '../../../helpers/utils/transactions.util';
import GasDetailsItem from '../gas-details-item';
import { getCurrentDraftTransaction } from '../../../ducks/send';
import { TransactionEnvelopeType } from '../../../../shared/constants/transaction';
import { ConfirmLegacyGasDisplay } from './confirm-legacy-gas-display';

const ConfirmGasDisplay = ({
  userAcknowledgedGasMissing = false,
  isEligibleToEarnMask,
}) => {
  const { txParams } = useSelector((state) => txDataSelector(state));

  const draftTransaction = useSelector(getCurrentDraftTransaction);
  const transactionType = draftTransaction?.transactionType;
  let isLegacyTxn;
  if (transactionType) {
    isLegacyTxn = transactionType === TransactionEnvelopeType.legacy;
  } else {
    isLegacyTxn = isLegacyTransaction(txParams);
  }

  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const supportsEIP1559 = networkAndAccountSupports1559 && !isLegacyTxn;

  return supportsEIP1559 ? (
    <GasDetailsItem
      userAcknowledgedGasMissing={userAcknowledgedGasMissing}
      isEligibleToEarnMask
    />
  ) : (
    <ConfirmLegacyGasDisplay />
  );
};

ConfirmGasDisplay.propTypes = {
  userAcknowledgedGasMissing: PropTypes.bool,
};

export default ConfirmGasDisplay;
