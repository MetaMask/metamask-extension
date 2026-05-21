import { useSelector } from 'react-redux';

import { calcTokenAmount } from '../../../../../shared/lib/transactions-controller-utils';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { formatAmount } from '../../components/simulation-details/formatAmount';
import { useConfirmationId } from '../useConfirmationId';

type PendingUniversalTransaction = {
  approvalId: string;
  chainNamespace: string;
  chain: string;
  accountId: string;
  from: string;
  to: string;
  value: string;
  assetType: string;
  assetSymbol: string;
  assetDecimals: number;
  feeRaw?: string;
  feeAssetType?: string;
  origin: string;
  createdAt: number;
};

export type UniversalTransactionData = {
  approvalId: string;
  chainNamespace: string;
  chain: string;
  accountId: string;
  from: string;
  to: string;
  value: string;
  assetType: string;
  assetSymbol: string;
  assetDecimals: number;
  feeRaw?: string;
  feeAssetType?: string;
  origin: string;
  formattedAmount: string;
  formattedFee?: string;
};

function selectPendingUniversalTransactionById(
  state: { metamask: { pendingTransactions?: Record<string, PendingUniversalTransaction> } },
  id: string | undefined,
): PendingUniversalTransaction | undefined {
  return id ? state.metamask.pendingTransactions?.[id] : undefined;
}

export function useUniversalTransactionDataOptional():
  | UniversalTransactionData
  | undefined {
  const confirmationId = useConfirmationId();
  const locale = useSelector(getIntlLocale);
  const pendingTx = useSelector((state) =>
    selectPendingUniversalTransactionById(
      state as Parameters<typeof selectPendingUniversalTransactionById>[0],
      confirmationId,
    ),
  );

  if (!pendingTx) {
    return undefined;
  }

  const formattedAmount = formatAmount(
    locale,
    calcTokenAmount(pendingTx.value, pendingTx.assetDecimals),
  );

  const formattedFee = pendingTx.feeRaw
    ? formatAmount(
        locale,
        calcTokenAmount(pendingTx.feeRaw, pendingTx.assetDecimals),
      )
    : undefined;

  return {
    approvalId: pendingTx.approvalId,
    chainNamespace: pendingTx.chainNamespace,
    chain: pendingTx.chain,
    accountId: pendingTx.accountId,
    from: pendingTx.from,
    to: pendingTx.to,
    value: pendingTx.value,
    assetType: pendingTx.assetType,
    assetSymbol: pendingTx.assetSymbol,
    assetDecimals: pendingTx.assetDecimals,
    feeRaw: pendingTx.feeRaw,
    feeAssetType: pendingTx.feeAssetType,
    origin: pendingTx.origin,
    formattedAmount,
    formattedFee,
  };
}
