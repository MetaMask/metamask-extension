import React, { useCallback, useEffect, useState } from 'react';
import { add0x, Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../context/confirm';
import {
  hexToDecimal,
  decimalToHex,
} from '../../../../../shared/modules/conversion.utils';
import { FormTextField } from '../../../../components/component-library';
import { validateGas } from '../../utils/gasValidations';

export const GasInput = ({
  onChange,
  onErrorChange,
}: {
  onChange: (value: Hex) => void;
  onErrorChange: (error: string | undefined) => void;
}) => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const initialGasLimit = hexToDecimal(
    currentConfirmation?.txParams?.gas as string,
  ).toString();
  const [value, setValue] = useState(initialGasLimit);
  const [error, setError] = useState<string | undefined>(undefined);

  const validateGasCallback = useCallback(
    (valueToBeValidated: string): string | undefined => {
      const validationError = validateGas(valueToBeValidated, t);
      setError(validationError);
      return validationError;
    },
    [t],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      const validationError = validateGasCallback(newValue);
      setValue(newValue);
      if (!validationError) {
        const updatedGasLimitHex = add0x(decimalToHex(newValue)) as Hex;
        onChange(updatedGasLimitHex);
      }
    },
    [onChange, validateGasCallback],
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
