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
import { validateMaxBaseFee } from '../../utils/gasValidations';

export const MaxBaseFeeInput = ({
  maxPriorityFeePerGas,
  onChange,
  onErrorChange,
}: {
  maxPriorityFeePerGas: Hex;
  onChange: (value: Hex) => void;
  onErrorChange: (error: string | undefined) => void;
}) => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const initialMaxBaseFee = hexWEIToDecGWEI(
    currentConfirmation?.txParams?.maxFeePerGas as string,
  ).toString();
  const [value, setValue] = useState(initialMaxBaseFee);
  const [error, setError] = useState<string | undefined>(undefined);

  const { gasFeeEstimates } = useGasFeeEstimates(
    currentConfirmation?.networkClientId,
  );

  const validateMaxBaseFeeCallback = useCallback(
    (valueToBeValidated: string): string | undefined => {
      const maxPriorityFeeInDec =
        hexWEIToDecGWEI(maxPriorityFeePerGas).toString();

      const validationError = validateMaxBaseFee(
        valueToBeValidated,
        maxPriorityFeeInDec,
        t,
      );
      setError(validationError);
      return validationError;
    },
    [maxPriorityFeePerGas, t],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      const validationError = validateMaxBaseFeeCallback(newValue);
      setValue(newValue);
      if (!validationError) {
        const updatedMaxBaseFee = decGWEIToHexWEI(newValue) as Hex;
        onChange(updatedMaxBaseFee);
      }
    },
    [onChange, validateMaxBaseFeeCallback],
  );

  useEffect(() => {
    validateMaxBaseFeeCallback(value);
  }, [validateMaxBaseFeeCallback, value]);

  useEffect(() => {
    onErrorChange(error);
  }, [error, onErrorChange]);

  const { estimatedBaseFee, historicalBaseFeeRange } =
    (gasFeeEstimates as GasFeeEstimates) || {};

  const feeRangesExists = estimatedBaseFee && historicalBaseFeeRange;

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      <FormTextField
        id="max-base-fee-input"
        data-testid="max-base-fee-input"
        error={Boolean(error)}
        helpText={error}
        onChange={handleChange}
        endAccessory={
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('gwei')}
          </Text>
        }
        label={t('maxBaseFee')}
        value={value}
      />
      {feeRangesExists && (
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('currentEstimatedBaseFee', [
              limitToMaximumDecimalPlaces(parseFloat(estimatedBaseFee), 2),
            ])}
          </Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('currentHistoricalBaseFeeRange', [
              limitToMaximumDecimalPlaces(
                parseFloat(historicalBaseFeeRange?.[0]),
                2,
              ),
              limitToMaximumDecimalPlaces(
                parseFloat(historicalBaseFeeRange?.[1]),
                2,
              ),
            ])}
          </Text>
        </Box>
      )}
    </Box>
  );
};
