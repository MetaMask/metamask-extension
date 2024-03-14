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
    gasLimit: false,
  });

  const setErrorValue = useCallback(
    (field, value) => {
      if (errors[field] !== value) {
        setErrors({ ...errors, [field]: value });
      }
    },
    [errors, setErrors],
  );
  const [maxBaseFee, setMaxBaseFee] = useState();

  return (
    <AdvancedGasFeePopoverContext.Provider
      value={{
        gasLimit,
        hasErrors:
          errors.maxFeePerGas || errors.maxPriorityFeePerGas || errors.gasLimit,
        gasErrors: errors,
        maxFeePerGas,
        maxPriorityFeePerGas,
        setErrorValue,
        maxBaseFee,
        setGasLimit,
        setMaxPriorityFeePerGas,
        setMaxFeePerGas,
        setMaxBaseFee,
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
