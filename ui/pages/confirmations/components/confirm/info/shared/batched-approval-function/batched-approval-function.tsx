import React from 'react';
import { BigNumber } from 'bignumber.js';
import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';

import { DecodedTransactionDataMethod } from '../../../../../../../../shared/types/transaction-decode';
import { TokenStandard } from '../../../../../../../../shared/constants/transaction';
import { parseApprovalTransactionData } from '../../../../../../../../shared/modules/transaction.utils';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { getTokenStandardAndDetails } from '../../../../../../../store/actions';
import { useAsyncResult } from '../../../../../../../hooks/useAsync';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { Box } from '../../../../../../../components/component-library';
import { ERC20_DEFAULT_DECIMALS } from '../../../../../utils/token';
import { useConfirmContext } from '../../../../../context/confirm';
import { isSpendingCapUnlimited } from '../../approve/hooks/use-approve-token-simulation';

export type TranslateFunction = (arg: string) => string;

const getBatchedApprovalDisplayValue = async (
  t: TranslateFunction,
  data?: Hex,
  to?: Hex,
) => {
  const parseResult = data ? parseApprovalTransactionData(data) : undefined;

  if (!parseResult) {
    return undefined;
  }

  const {
    amountOrTokenId,
    isApproveAll,
    tokenAddress: token,
    spender,
  } = parseResult;

  const tokenAddress = token ?? to ?? '';

  if (isApproveAll) {
    return { spender, amount: t('all') };
  }

  const tokenData = await getTokenStandardAndDetails(tokenAddress);

  if (!tokenData?.standard) {
    return undefined;
  }

  const isUnlimited = isSpendingCapUnlimited(
    amountOrTokenId?.toNumber() ?? 0,
    Number(tokenData?.decimals ?? 0),
  );

  if (isUnlimited) {
    return { spender, amount: t('unlimited') };
  }

  if (!amountOrTokenId) {
    return undefined;
  }

  if (tokenData?.standard === TokenStandard.ERC20) {
    const tokenAmount = new BigNumber(amountOrTokenId, 10)
      .shift(
        tokenData.decimals
          ? parseInt(tokenData.decimals, 10) * -1
          : ERC20_DEFAULT_DECIMALS,
      )
      .toString();

    return {
      spender,
      amount: `${tokenAmount} ${tokenData.symbol}`,
    };
  }

  if (tokenData?.standard === TokenStandard.ERC721) {
    return {
      spender,
      tokenId: amountOrTokenId.toString(),
    };
  }

  return undefined;
};

export function BatchedApprovalFunction({
  method,
  nestedTransactionIndex,
}: {
  method: DecodedTransactionDataMethod;
  nestedTransactionIndex: number;
}) {
  const t = useI18nContext();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId } = currentConfirmation;
  const nestedTransaction =
    currentConfirmation?.nestedTransactions?.[nestedTransactionIndex];

  const { data, to } = nestedTransaction ?? {};

  const { value, pending } = useAsyncResult(
    () => getBatchedApprovalDisplayValue(t as TranslateFunction, data, to),
    [data, to],
  );

  if (pending || !value) {
    return null;
  }

  return (
    <>
      <ConfirmInfoRow
        data-testid="advanced-details-data-function"
        label={t('transactionDataFunction')}
        tooltip={method.description}
      >
        <ConfirmInfoRowText text={method.name} />
      </ConfirmInfoRow>
      <Box paddingLeft={2}>
        <ConfirmInfoRow label={t('spender')}>
          <ConfirmInfoRowAddress
            address={value.spender ?? ''}
            chainId={chainId}
          />
        </ConfirmInfoRow>
        {value.amount && (
          <ConfirmInfoRow label={t('amount')}>
            <ConfirmInfoRowText text={value.amount} />
          </ConfirmInfoRow>
        )}
        {value.tokenId && (
          <ConfirmInfoRow label={t('tokenId')}>
            <ConfirmInfoRowText text={value.tokenId} />
          </ConfirmInfoRow>
        )}
      </Box>
    </>
  );
}
