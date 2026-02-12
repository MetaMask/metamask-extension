import React, { useCallback, useEffect, useState } from 'react';
import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  Box,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../context/confirm';
import {
  hexWEIToDecGWEI,
  decGWEIToHexWEI,
} from '../../../../../shared/modules/conversion.utils';
import { FormTextField } from '../../../../components/component-library';
import { validateGasPrice } from '../../utils/gasValidations';

export const GasPriceInput = ({
  onChange,
  onErrorChange,
}: {
  onChange: (value: Hex) => void;
  onErrorChange: (error: string | undefined) => void;
}) => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const initialGasPrice = hexWEIToDecGWEI(
    currentConfirmation?.txParams?.gasPrice as string,
  ).toString();
  const [value, setValue] = useState(initialGasPrice);
  const [error, setError] = useState<string | undefined>(undefined);

  const validateGasPriceCallback = useCallback(
    (valueToBeValidated: string): string | undefined => {
      const validationError = validateGasPrice(valueToBeValidated, t);
      setError(validationError);
      return validationError;
    },
    [t],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      const validationError = validateGasPriceCallback(newValue);
      setValue(newValue);
      if (!validationError) {
        const updatedGasPrice = decGWEIToHexWEI(newValue) as Hex;
        onChange(updatedGasPrice);
      }
    },
    [onChange, validateGasPriceCallback],
  );

  useEffect(() => {
    validateGasPriceCallback(value);
  }, [validateGasPriceCallback, value]);

  useEffect(() => {
    onErrorChange(error);
  }, [error, onErrorChange]);

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      <FormTextField
        id="gas-price-input"
        data-testid="gas-price-input"
        error={Boolean(error)}
        helpText={error}
        onChange={handleChange}
        endAccessory={
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('gwei')}
          </Text>
        }
        label={t('gasPrice')}
        value={value}
      />
    </Box>
  );
};
