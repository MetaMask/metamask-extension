import { useState, useEffect, useCallback } from 'react';

import { Numeric } from '../../../../../shared/lib/Numeric';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  fromTokenMinUnitsNumeric,
  isValidPositiveNumericString,
  normalizeAmount,
} from '../../utils/send';
import { useSendContext } from '../../context/send';
import { Asset, AssetStandard } from '../../types/send';
import { useSendType } from './useSendType';
import { useSnapAmountOnInput } from './useSnapAmountOnInput';
import { useBalance } from './useBalance';

type SnapOnAmountInputResult = {
  valid: boolean;
  errors: { code: string }[];
};

export const useAmountValidation = () => {
  const t = useI18nContext();
  const { isNonEvmSendType } = useSendType();
  const { asset, value } = useSendContext();
  const { validateAmountWithSnap } = useSnapAmountOnInput();
  const { rawBalanceNumeric } = useBalance();
  const [amountError, setAmountError] = useState<string | undefined>(undefined);

  const setAndReturnError = useCallback((errorMessage: string | undefined) => {
    setAmountError(errorMessage);
    return errorMessage;
  }, []);

  const validateNonEvmAmount = useCallback(
    async (amount: string): Promise<string | undefined> => {
      if (!isNonEvmSendType) {
        return undefined;
      }

      if (rawBalanceNumeric.isZero()) {
        return t('insufficientFundsSend');
      }

      try {
        console.log('[useAmountValidation] calling validateAmountWithSnap with amount:', amount || '0');
        const result = (await validateAmountWithSnap(
          amount || '0',
        )) as SnapOnAmountInputResult;
        console.log('[useAmountValidation] snap result:', result);

        if (result.errors?.length > 0) {
          return mapSnapErrorCodeIntoTranslation(result.errors[0].code, t);
        }
        return undefined;
      } catch (error) {
        console.error('[useAmountValidation] snap RPC threw error:', error);
        return t('invalidValue');
      }
    },
    [t, validateAmountWithSnap, isNonEvmSendType, rawBalanceNumeric],
  );

  const validateAmountAsync = useCallback(async () => {
    if (!value) {
      return setAndReturnError(undefined);
    }

    const normalizedValue = normalizeAmount(value);

    const validations = [
      { name: 'validatePositiveNumericString', fn: () => validatePositiveNumericString(normalizedValue, t) },
      { name: 'validateERC1155Balance', fn: () => validateERC1155Balance(asset as Asset, normalizedValue, t) },
      { name: 'validateTokenBalance', fn: () =>
        validateTokenBalance(
          normalizedValue,
          rawBalanceNumeric,
          asset?.decimals,
          t,
        ),
      },
      { name: 'validateNonEvmAmount', fn: () => validateNonEvmAmount(normalizedValue) },
    ];

    for (const validation of validations) {
      const error = await Promise.resolve(validation.fn());
      console.log(`[useAmountValidation] ${validation.name} result:`, error ?? 'OK', '| rawBalanceNumeric:', rawBalanceNumeric?.toString(), '| decimals:', asset?.decimals);
      if (error) {
        console.error(`[useAmountValidation] BLOCKED by ${validation.name}:`, error);
        return setAndReturnError(error);
      }
    }

    return setAndReturnError(undefined);
  }, [
    asset,
    rawBalanceNumeric,
    t,
    value,
    validateNonEvmAmount,
    setAndReturnError,
  ]);

  // This callback is needed for non-EVM validation when nothing is typed into amount
  const validateNonEvmAmountAsync = useCallback(async () => {
    const error = await validateNonEvmAmount(normalizeAmount(value));
    return setAndReturnError(error);
  }, [value, validateNonEvmAmount, setAndReturnError]);

  useEffect(() => {
    validateAmountAsync();
  }, [validateAmountAsync]);

  return { amountError, validateNonEvmAmountAsync };
};

export function validateERC1155Balance(
  asset: Asset,
  value: string | undefined,
  t: ReturnType<typeof useI18nContext>,
): string | undefined {
  if (asset?.standard !== AssetStandard.ERC1155) {
    return undefined;
  }

  if (asset?.balance && value) {
    const valueInt = parseInt(value, 10);
    const balanceInt = parseInt(asset.balance.toString(), 10);
    if (valueInt > balanceInt) {
      return t('insufficientFundsSend');
    }
  }

  return undefined;
}

export function validateTokenBalance(
  amount: string,
  rawBalanceNumeric: Numeric,
  decimals: number | undefined,
  t: ReturnType<typeof useI18nContext>,
): string | undefined {
  const amountInputNumeric = fromTokenMinUnitsNumeric(amount, 10, decimals);
  if (rawBalanceNumeric.lessThan(amountInputNumeric)) {
    return t('insufficientFundsSend');
  }
  return undefined;
}

export function validatePositiveNumericString(
  value: string,
  t: ReturnType<typeof useI18nContext>,
): string | undefined {
  const valid = isValidPositiveNumericString(value);
  console.log('[useAmountValidation] validatePositiveNumericString value:', JSON.stringify(value), 'valid:', valid);
  if (!valid) {
    return t('invalidValue');
  }
  return undefined;
}

export function mapSnapErrorCodeIntoTranslation(
  errorCode: string,
  t: ReturnType<typeof useI18nContext>,
): string {
  switch (errorCode) {
    case 'InsufficientBalance':
      return t('insufficientFundsSend');
    case 'InsufficientBalanceToCoverFee':
      return t('insufficientBalanceToCoverFees');
    case 'Invalid':
    default:
      return t('invalidValue');
  }
}
