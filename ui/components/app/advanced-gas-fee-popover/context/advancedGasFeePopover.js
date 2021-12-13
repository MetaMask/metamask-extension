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

  const setErrorValue = useCallback(
    (field, value) => {
      if (errors[field] !== value) {
        setErrors({ ...errors, [field]: value });
      }
    },
    [errors, setErrors],
  );

  return (
    <AdvancedGasFeePopoverContext.Provider
      value={{
        gasLimit,
        hasErrors: errors.maxFeePerGas || errors.maxPriorityFeePerGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        setErrorValue,
        setGasLimit,
        setMaxPriorityFeePerGas,
        setMaxFeePerGas,
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
