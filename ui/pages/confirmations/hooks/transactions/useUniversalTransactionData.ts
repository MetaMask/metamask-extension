import { BigNumber } from 'bignumber.js';
import { useSelector } from 'react-redux';

import { MultichainNativeAssets } from '../../../../../shared/constants/multichain/assets';
import { calcTokenAmount } from '../../../../../shared/lib/transactions-controller-utils';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { useFiatFormatter } from '../../../../hooks/useFiatFormatter';
import { getAssetsRates } from '../../../../selectors/assets';
import { formatAmount } from '../../components/simulation-details/formatAmount';
import { useConfirmationId } from '../useConfirmationId';

const FEE_DECIMALS_BY_NAMESPACE: Record<string, number> = {
  solana: 9,
};

const NATIVE_ASSET_ID_BY_NAMESPACE: Record<string, string> = {
  solana: MultichainNativeAssets.SOLANA,
};

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
  feeAssetSymbol?: string;
  feeAssetDecimals?: number;
  origin: string;
  formattedAmount: string;
  formattedFee?: string;
  formattedFeeFiat?: string;
};

function selectPendingUniversalTransactionById(
  state: { metamask: { pendingTransactions?: Record<string, PendingUniversalTransaction> } },
  id: string | undefined,
): PendingUniversalTransaction | undefined {
  return id ? state.metamask.pendingTransactions?.[id] : undefined;
}

const FEE_SYMBOL_BY_NAMESPACE: Record<string, string> = {
  solana: 'SOL',
};

export function useUniversalTransactionDataOptional():
  | UniversalTransactionData
  | undefined {
  const confirmationId = useConfirmationId();
  const locale = useSelector(getIntlLocale);
  const assetRates = useSelector(getAssetsRates);
  const fiatFormatter = useFiatFormatter();
  const pendingTx = useSelector((state) =>
    selectPendingUniversalTransactionById(
      state as Parameters<typeof selectPendingUniversalTransactionById>[0],
      confirmationId,
    ),
  );

  if (!pendingTx) {
    return undefined;
  }

  const feeAssetDecimals =
    FEE_DECIMALS_BY_NAMESPACE[pendingTx.chainNamespace];
  const feeAssetSymbol = FEE_SYMBOL_BY_NAMESPACE[pendingTx.chainNamespace];
  const nativeAssetId = NATIVE_ASSET_ID_BY_NAMESPACE[pendingTx.chainNamespace];

  const formattedAmount = formatAmount(
    locale,
    calcTokenAmount(pendingTx.value, pendingTx.assetDecimals),
  );

  const feeAmount =
    pendingTx.feeRaw && feeAssetDecimals !== undefined
      ? calcTokenAmount(pendingTx.feeRaw, feeAssetDecimals)
      : undefined;

  const formattedFee = feeAmount ? formatAmount(locale, feeAmount) : undefined;

  const conversionRate =
    nativeAssetId && assetRates?.[nativeAssetId]?.rate
      ? assetRates[nativeAssetId].rate
      : undefined;

  const fiatValue =
    feeAmount && conversionRate
      ? new BigNumber(conversionRate).times(feeAmount).toNumber()
      : undefined;

  let formattedFeeFiat: string | undefined;
  if (fiatValue !== undefined) {
    const fiatBn = new BigNumber(fiatValue);
    if (fiatBn.eq(0)) {
      formattedFeeFiat = undefined;
    } else if (fiatBn.lt(new BigNumber(0.01))) {
      formattedFeeFiat = `< ${fiatFormatter(0.01)}`;
    } else {
      formattedFeeFiat = fiatFormatter(fiatBn.toNumber());
    }
  }

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
    feeAssetSymbol,
    feeAssetDecimals,
    origin: pendingTx.origin,
    formattedAmount,
    formattedFee,
    formattedFeeFiat,
  };
}
