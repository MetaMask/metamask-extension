import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import {
  checkNetworkAndAccountSupports1559,
  txDataSelector,
} from '../../../../selectors';
import { isLegacyTransaction } from '../../../../helpers/utils/transactions.util';
import GasDetailsItem from '../gas-details-item';
import { getCurrentDraftTransaction } from '../../../../ducks/send';
import { ConfirmLegacyGasDisplay } from './confirm-legacy-gas-display';

const ConfirmGasDisplay = ({ userAcknowledgedGasMissing = false }) => {
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
  const dataTestId = 'confirm-gas-display';

  return supportsEIP1559 ? (
    <GasDetailsItem
      data-testid={dataTestId}
      userAcknowledgedGasMissing={userAcknowledgedGasMissing}
    />
  ) : (
    <ConfirmLegacyGasDisplay data-testid={dataTestId} />
  );
};

ConfirmGasDisplay.propTypes = {
  userAcknowledgedGasMissing: PropTypes.bool,
};

export default ConfirmGasDisplay;
