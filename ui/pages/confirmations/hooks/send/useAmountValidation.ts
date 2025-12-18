import { useState, useEffect, useCallback } from 'react';

import { Numeric } from '../../../../../shared/modules/Numeric';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  addLeadingZeroIfNeeded,
  fromTokenMinUnitsNumeric,
  isValidPositiveNumericString,
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

  const validateNonEvmAmount = useCallback(async (): Promise<
    string | undefined
  > => {
    if (!isNonEvmSendType) {
      return undefined;
    }

    if (rawBalanceNumeric.isZero()) {
      return t('insufficientFundsSend');
    }

    try {
      const result = (await validateAmountWithSnap(
        addLeadingZeroIfNeeded(value) || '0',
      )) as SnapOnAmountInputResult;

      if (result.errors?.length > 0) {
        return mapSnapErrorCodeIntoTranslation(result.errors[0].code, t);
      }
      return undefined;
    } catch (error) {
      return t('invalidValue');
    }
  }, [t, value, validateAmountWithSnap, isNonEvmSendType, rawBalanceNumeric]);

  const validateAmountAsync = useCallback(async () => {
    if (!value) {
      return setAndReturnError(undefined);
    }

    const validations = [
      () => validatePositiveNumericString(value, t),
      () => validateERC1155Balance(asset as Asset, value, t),
      () => validateTokenBalance(value, rawBalanceNumeric, asset?.decimals, t),
      validateNonEvmAmount,
    ];

    for (const validation of validations) {
      const error = await Promise.resolve(validation());
      if (error) {
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
    const error = await validateNonEvmAmount();
    return setAndReturnError(error);
  }, [validateNonEvmAmount, setAndReturnError]);

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
  if (!isValidPositiveNumericString(value)) {
    return t('invalidValue');
  }
  return undefined;
}

function mapSnapErrorCodeIntoTranslation(
  errorCode: string,
  t: ReturnType<typeof useI18nContext>,
): string {
  switch (errorCode) {
    case 'InsufficientBalance':
      return t('insufficientFundsSend');
    case 'Invalid':
    default:
      return t('invalidValue');
  }
}
