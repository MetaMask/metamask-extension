import React, { createContext, useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';

export const AdvancedGasFeePopoverContext = createContext({});

export const AdvancedGasFeePopoverContextProvider = ({ children }) => {
  const [gasLimit, setGasLimit] = useState();
  const [maxFeePerGas, setMaxFeePerGas] = useState();
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState();
  const [errors, setErrors] = useState({
    maxFeePerGas: false,
    maxPriorityFeePerGas: false,
  });
  const [feeTrends, setFeeTrends] = useState({
    baseFeeTrend: '',
    priorityFeeTrend: '',
  });

  const setErrorValue = useCallback(
    (field, value) => {
      if (errors[field] !== value) {
        setErrors({ ...errors, [field]: value });
      }
    },
    [errors, setErrors],
  );

  const setFeeTrendsValue = useCallback(
    (field, value) => {
      if (value !== 'level' && feeTrends[field] !== value) {
        setFeeTrends({ ...feeTrends, [field]: value });
      }
    },
    [feeTrends, setFeeTrends],
  );

  return (
    <AdvancedGasFeePopoverContext.Provider
      value={{
        gasLimit,
        feeTrends,
        hasErrors: errors.maxFeePerGas || errors.maxPriorityFeePerGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        setErrorValue,
        setGasLimit,
        setMaxPriorityFeePerGas,
        setMaxFeePerGas,
        setFeeTrendsValue,
      }}
    >
      {children}
    </AdvancedGasFeePopoverContext.Provider>
  );
};

export function useAdvancedGasFeePopoverContext() {
  return useContext(AdvancedGasFeePopoverContext);
}

AdvancedGasFeePopoverContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
