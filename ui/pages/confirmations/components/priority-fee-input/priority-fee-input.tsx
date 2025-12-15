import React, { useCallback, useEffect, useState } from 'react';
import { Hex } from '@metamask/utils';
import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useGasFeeEstimates } from '../../../../hooks/useGasFeeEstimates';
import { useConfirmContext } from '../../context/confirm';
import {
  hexWEIToDecGWEI,
  decGWEIToHexWEI,
} from '../../../../../shared/modules/conversion.utils';
import { FormTextField } from '../../../../components/component-library';
import { limitToMaximumDecimalPlaces } from '../../utils/number';
import { validatePriorityFee } from '../../utils/gasValidations';

export const PriorityFeeInput = ({
  maxFeePerGas,
  onChange,
  onErrorChange,
}: {
  maxFeePerGas: Hex;
  onChange: (value: Hex) => void;
  onErrorChange: (error: string | undefined) => void;
}) => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const initialPriorityFee = hexWEIToDecGWEI(
    currentConfirmation?.txParams?.maxPriorityFeePerGas as string,
  ).toString();
  const [value, setValue] = useState(initialPriorityFee);
  const [error, setError] = useState<string | undefined>(undefined);

  const { gasFeeEstimates } = useGasFeeEstimates(
    currentConfirmation?.networkClientId,
  );

  const validatePriorityFeeCallback = useCallback(
    (valueToBeValidated: string): string | undefined => {
      const maxFeePerGasInDec = hexWEIToDecGWEI(maxFeePerGas).toString();

      const validationError = validatePriorityFee(
        valueToBeValidated,
        maxFeePerGasInDec,
        t,
      );
      setError(validationError);
      return validationError;
    },
    [maxFeePerGas, t],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      const validationError = validatePriorityFeeCallback(newValue);
      setValue(newValue);
      if (!validationError) {
        const updatedPriorityFee = decGWEIToHexWEI(newValue) as Hex;
        onChange(updatedPriorityFee);
      }
    },
    [onChange, validatePriorityFeeCallback],
  );

  useEffect(() => {
    validatePriorityFeeCallback(value);
  }, [validatePriorityFeeCallback, value]);

  useEffect(() => {
    onErrorChange(error);
  }, [error, onErrorChange]);

  const { latestPriorityFeeRange, historicalPriorityFeeRange } =
    (gasFeeEstimates as GasFeeEstimates) || {};

  const feeRangesExists = latestPriorityFeeRange && historicalPriorityFeeRange;

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      <FormTextField
        id="priority-fee-input"
        data-testid="priority-fee-input"
        error={Boolean(error)}
        helpText={error}
        onChange={handleChange}
        endAccessory={
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('gwei')}
          </Text>
        }
        label={t('priorityFee')}
        value={value}
      />
      {feeRangesExists && (
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('currentEstimatedPriorityFeeRange', [
              limitToMaximumDecimalPlaces(
                parseFloat(latestPriorityFeeRange?.[0]),
                2,
              ),
              limitToMaximumDecimalPlaces(
                parseFloat(latestPriorityFeeRange?.[1]),
                2,
              ),
            ])}
          </Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('currentHistoricalPriorityFeeRange', [
              limitToMaximumDecimalPlaces(
                parseFloat(historicalPriorityFeeRange?.[0]),
                2,
              ),
              limitToMaximumDecimalPlaces(
                parseFloat(historicalPriorityFeeRange?.[1]),
                2,
              ),
            ])}
          </Text>
        </Box>
      )}
    </Box>
  );
};
