import { createContext, useContext } from 'react';
import { useGasFeeInputs } from '../hooks/gasFeeInput/useGasFeeInputs';

export const GasFeeContext = createContext({});

export const GasFeeContextProvider = ({
  defaultEstimateToUse,
  transaction,
  minimumGasLimit,
  editGasMode,
}) => {
  const gasFeeDetails = useGasFeeInputs(
    defaultEstimateToUse,
    transaction,
    minimumGasLimit,
    editGasMode,
  );
  return gasFeeDetails;
};

export function useGasFeeContext() {
  return useContext(GasFeeContext);
}
