import {
  BatchTransactionParams,
  SimulationTokenBalanceChange,
  SimulationTokenStandard,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../context/confirm';
import { useAsyncResult } from '../../../../../../hooks/useAsyncResult';
import { getTokenStandardAndDetails } from '../../../../../../store/actions';
import { Hex } from '@metamask/utils';
import { parseApprovalTransactionData } from '../../../../../../../shared/modules/transaction.utils';
import { useBalanceChanges } from '../../../simulation-details/useBalanceChanges';
import { BalanceChange } from '../../../simulation-details/types';

export function useBatchApproveBalanceChanges() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId, nestedTransactions } = currentConfirmation ?? {};

  const { value: simulationBalanceChanges, pending: pendingSimulationChanges } =
    useBatchApproveSimulationBalanceChanges({
      nestedTransactions,
    });

  const { value: balanceChanges, pending: pendingBalanceChanges } =
    useBalanceChanges({
      chainId,
      simulationData: {
        tokenBalanceChanges: simulationBalanceChanges ?? [],
      },
    });

  const finalBalanceChanges = (balanceChanges ?? []).map<BalanceChange>(
    (change) => ({
      ...change,
      isApproval: true,
    }),
  );

  const pending = pendingSimulationChanges || pendingBalanceChanges;

  return { pending, value: finalBalanceChanges };
}

function useBatchApproveSimulationBalanceChanges({
  nestedTransactions,
}: {
  nestedTransactions?: BatchTransactionParams[];
}) {
  return useAsyncResult(
    async () => buildSimulationTokenBalanceChanges({ nestedTransactions }),
    [nestedTransactions],
  );
}

async function buildSimulationTokenBalanceChanges({
  nestedTransactions,
}: {
  nestedTransactions?: BatchTransactionParams[];
}): Promise<SimulationTokenBalanceChange[]> {
  const balanceChanges: SimulationTokenBalanceChange[] = [];

  if (!nestedTransactions) {
    return balanceChanges;
  }

  for (const transaction of nestedTransactions) {
    const { data, to } = transaction;

    if (!data || !to) {
      continue;
    }

    const tokenData = await getTokenStandardAndDetails(to);

    if (!tokenData?.standard) {
      continue;
    }

    const standard =
      tokenData?.standard?.toLowerCase() as SimulationTokenStandard;
    const isNFT = standard !== SimulationTokenStandard.erc20;

    const parseResult = parseApprovalTransactionData(data);

    if (!parseResult) {
      continue;
    }

    const { amountOrTokenId, isApproveAll, isRevokeAll } = parseResult;
    const amountOrTokenIdHex = amountOrTokenId?.toHexString() as Hex;

    const difference =
      isNFT || amountOrTokenId === undefined ? '0x1' : amountOrTokenIdHex;

    const tokenId = isNFT && amountOrTokenId ? amountOrTokenIdHex : undefined;

    const balanceChange: SimulationTokenBalanceChange = {
      address: to,
      difference,
      id: tokenId,
      isDecrease: true,
      newBalance: '0x0',
      previousBalance: '0x0',
      standard,
    };

    balanceChanges.push(balanceChange);
  }

  return balanceChanges;
}
