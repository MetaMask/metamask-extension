import React, { useCallback, useEffect, useState } from 'react';
import { add0x, Hex } from '@metamask/utils';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  hexToDecimal,
  decimalToHex,
} from '../../../../../shared/lib/conversion.utils';
import { FormTextField } from '../../../../components/component-library';
import { validateGas } from '../../utils/gasValidations';

export const GasInput = ({
  gasLimit,
  onChange,
  onErrorChange,
}: {
  gasLimit: Hex | undefined;
  onChange: (value: Hex) => void;
  onErrorChange: (error: string | undefined) => void;
}) => {
  const t = useI18nContext();
  const [state, setState] = useState<{
    error: string | undefined;
    sourceGasLimit: Hex | undefined;
    value: string;
  }>(() => ({
    error: undefined,
    sourceGasLimit: gasLimit,
    value: gasLimit ? hexToDecimal(gasLimit).toString() : '',
  }));
  const gasLimitChanged = state.sourceGasLimit !== gasLimit;
  let { value } = state;
  if (gasLimitChanged) {
    value = gasLimit ? hexToDecimal(gasLimit).toString() : '';
  }
  const error = gasLimitChanged ? undefined : state.error;

  const validateGasCallback = useCallback(
    (valueToBeValidated: string): string | undefined => {
      return validateGas(valueToBeValidated, t);
    },
    [t],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      const validationError = validateGasCallback(newValue);
      setState({
        error: validationError,
        sourceGasLimit: gasLimit,
        value: newValue,
      });
      if (!validationError) {
        const updatedGasLimitHex = add0x(decimalToHex(newValue)) as Hex;
        onChange(updatedGasLimitHex);
      }
    },
    [gasLimit, onChange, validateGasCallback],
  );

  useEffect(() => {
    onErrorChange(error);
  }, [error, onErrorChange]);

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      <FormTextField
        id="gas-input"
        data-testid="gas-input"
        error={Boolean(error)}
        helpText={error}
        onChange={handleChange}
        label={t('gasLimit')}
        value={value}
      />
    </Box>
  );
};
