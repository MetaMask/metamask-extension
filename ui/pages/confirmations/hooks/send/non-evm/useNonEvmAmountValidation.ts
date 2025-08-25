import { CaipAssetType } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { useCallback } from 'react';

import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Asset } from '../../../types/send';
import { isDecimal } from '../../../utils/send';
import { useSendContext } from '../../../context/send';
import { validateAmountMultichain } from '../../../utils/multichain-snaps';

type SnapValidationResult = {
  errors: { code: string }[];
  valid: boolean;
};

type ValidateAmountFnArgs = {
  fromAccount: InternalAccount;
  amount?: string;
  asset?: Asset;
  t: ReturnType<typeof useI18nContext>;
};

const validateAmountFn = async ({
  fromAccount,
  amount,
  asset,
  t,
}: ValidateAmountFnArgs): Promise<string | undefined> => {
  if (!asset || amount === undefined || amount === null || amount === '') {
    return undefined;
  }
  if (!isDecimal(amount) || Number(amount) < 0) {
    return t('invalidValue');
  }
  const result = (await validateAmountMultichain(
    fromAccount as InternalAccount,
    {
      value: amount,
      accountId: fromAccount.id,
      assetId: asset.address as CaipAssetType,
    },
  )) as SnapValidationResult;
  const { errors, valid } = result ?? {};
  if (!valid) {
    if (
      errors.some(
        ({ code }: { code: string }) => code === 'InsufficientBalance',
      )
    ) {
      return t('insufficientFundsSend');
    }
  }
  return undefined;
};

export const useNonEvmAmountValidation = () => {
  const t = useI18nContext();
  const { asset, fromAccount, value } = useSendContext();

  const validateNonEvmAmount = useCallback(
    async () =>
      await validateAmountFn({
        amount: value,
        asset,
        fromAccount: fromAccount as InternalAccount,
        t,
      }),
    [asset, fromAccount, value, t],
  );

  return { validateNonEvmAmount };
};
