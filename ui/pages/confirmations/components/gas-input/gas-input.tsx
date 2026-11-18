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

export const GAS_INPUT_HELP_TEXT_ID = 'gas-input-help-text';

export const GasInput = ({
  gasLimit,
  helpText,
  isDisabled,
  onChange,
  onErrorChange,
}: {
  gasLimit: Hex | undefined;
  helpText?: string;
  isDisabled?: boolean;
  onChange: (value: Hex) => void;
  onErrorChange: (error: string | undefined) => void;
}) => {
  const t = useI18nContext();
  const [value, setValue] = useState(() =>
    gasLimit ? hexToDecimal(gasLimit).toString() : '',
  );
  const [error, setError] = useState<string | undefined>();
  const [sourceGasLimit, setSourceGasLimit] = useState(gasLimit);
  const gasLimitChanged = sourceGasLimit !== gasLimit;
  let valueDecimal = value;
  if (gasLimitChanged) {
    valueDecimal = gasLimit ? hexToDecimal(gasLimit).toString() : '';
  }
  const displayedError = gasLimitChanged ? undefined : error;

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
      setValue(newValue);
      setError(validationError);
      setSourceGasLimit(gasLimit);
      if (!validationError) {
        const updatedGasLimitHex = add0x(decimalToHex(newValue)) as Hex;
        onChange(updatedGasLimitHex);
      }
    },
    [gasLimit, onChange, validateGasCallback],
  );

  useEffect(() => {
    onErrorChange(displayedError);
  }, [displayedError, onErrorChange]);

  const displayedHelpText = displayedError ?? helpText;

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      <FormTextField
        id="gas-input"
        data-testid="gas-input"
        disabled={isDisabled}
        error={Boolean(displayedError)}
        helpText={displayedHelpText}
        helpTextProps={{ id: GAS_INPUT_HELP_TEXT_ID }}
        inputProps={{
          'aria-describedby': displayedHelpText
            ? GAS_INPUT_HELP_TEXT_ID
            : undefined,
          inputMode: 'numeric',
        }}
        onChange={handleChange}
        label={t('gasLimit')}
        value={valueDecimal}
      />
    </Box>
  );
};
