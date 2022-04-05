import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useGasFeeInputs } from '../hooks/gasFeeInput/useGasFeeInputs';
import { editGasModeIsSpeedUpOrCancel } from '../helpers/utils/gas';

export const GasFeeContext = createContext({});

export const GasFeeContextProvider = ({
  children,
  defaultEstimateToUse,
  transaction,
  minimumGasLimit,
  editGasMode,
}) => {
  const [retryTxMeta, setRetryTxMeta] = useState({
    txParams: transaction.txParams,
    id: transaction.id,
    userFeeLevel: transaction.userFeeLevel,
    originalGasEstimate: transaction.originalGasEstimate,
    userEditedGasLimit: transaction.userEditedGasLimit,
  });

  const transactionToUse = editGasModeIsSpeedUpOrCancel(editGasMode)
    ? retryTxMeta
    : transaction;

  const gasFeeDetails = useGasFeeInputs(
    defaultEstimateToUse,
    transactionToUse,
    minimumGasLimit,
    editGasMode,
    setRetryTxMeta,
  );
  return (
    <GasFeeContext.Provider value={gasFeeDetails}>
      {children}
    </GasFeeContext.Provider>
  );
};

export function useGasFeeContext() {
  return useContext(GasFeeContext);
}

GasFeeContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
  defaultEstimateToUse: PropTypes.string,
  transaction: PropTypes.object,
  minimumGasLimit: PropTypes.string,
  editGasMode: PropTypes.string,
};
