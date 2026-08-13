import { useState, useEffect, useCallback, useMemo } from 'react';

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
  const [asyncAmountErrorState, setAsyncAmountErrorState] = useState<{
    key: string;
    error: string | undefined;
  }>({ key: '', error: undefined });

  const syncAmountError = useMemo(() => {
    if (!value) {
      return undefined;
    }

    const normalizedValue = normalizeAmount(value);

    return (
      validatePositiveNumericString(normalizedValue, t) ||
      validateERC1155Balance(asset as Asset, normalizedValue, t) ||
      validateTokenBalance(
        normalizedValue,
        rawBalanceNumeric,
        asset?.decimals,
        t,
      )
    );
  }, [asset, rawBalanceNumeric, t, value]);

  const validationKey = `${value ?? ''}|${isNonEvmSendType}|${syncAmountError ?? ''}`;

  const asyncAmountError =
    asyncAmountErrorState.key === validationKey
      ? asyncAmountErrorState.error
      : undefined;

  const validateNonEvmAmount = useCallback(
    async (amount: string): Promise<string | undefined> => {
      if (!isNonEvmSendType) {
        return undefined;
      }

      if (rawBalanceNumeric.isZero()) {
        return t('insufficientFundsSend');
      }

      try {
        const result = (await validateAmountWithSnap(
          amount || '0',
        )) as SnapOnAmountInputResult;

        if (result.errors?.length > 0) {
          return mapSnapErrorCodeIntoTranslation(result.errors[0].code, t);
        }
        return undefined;
      } catch (error) {
        return t('invalidValue');
      }
    },
    [t, validateAmountWithSnap, isNonEvmSendType, rawBalanceNumeric],
  );

  const setAndReturnError = useCallback(
    (errorMessage: string | undefined) => {
      setAsyncAmountErrorState({ key: validationKey, error: errorMessage });
      return errorMessage;
    },
    [validationKey],
  );

  // This callback is needed for non-EVM validation when nothing is typed into amount
  const validateNonEvmAmountAsync = useCallback(async () => {
    const error = await validateNonEvmAmount(normalizeAmount(value));
    return setAndReturnError(error);
  }, [value, validateNonEvmAmount, setAndReturnError]);

  useEffect(() => {
    if (syncAmountError || !value || !isNonEvmSendType) {
      return;
    }

    let cancelled = false;

    validateNonEvmAmount(normalizeAmount(value)).then((error) => {
      if (!cancelled) {
        setAsyncAmountErrorState({ key: validationKey, error });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    syncAmountError,
    value,
    isNonEvmSendType,
    validateNonEvmAmount,
    validationKey,
  ]);

  const amountError = syncAmountError ?? asyncAmountError;

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
  if (!isValidPositiveNumericString(value)) {
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
