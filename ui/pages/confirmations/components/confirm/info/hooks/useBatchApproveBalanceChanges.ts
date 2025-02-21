import {
  BatchTransactionParams,
  SimulationTokenBalanceChange,
  SimulationTokenStandard,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../context/confirm';
import { useAsyncResult } from '../../../../../../hooks/useAsyncResult';
import { getTokenStandardAndDetails } from '../../../../../../store/actions';
import { add0x } from '@metamask/utils';
import { parseApprovalTransactionData } from '../../../../../../../shared/modules/transaction.utils';
import { useBalanceChanges } from '../../../simulation-details/useBalanceChanges';
import { BalanceChange } from '../../../simulation-details/types';
import { isSpendingCapUnlimited } from '../approve/hooks/use-approve-token-simulation';

type ApprovalBalanceChange = SimulationTokenBalanceChange & {
  isAll: boolean;
  isUnlimited: boolean;
};

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
    (change, index) => {
      const simulation = simulationBalanceChanges?.[index];

      return {
        ...change,
        isApproval: true,
        isAllApproval: simulation?.isAll ?? false,
        isUnlimitedApproval: simulation?.isUnlimited ?? false,
      };
    },
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
}): Promise<ApprovalBalanceChange[]> {
  const balanceChanges: ApprovalBalanceChange[] = [];

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

    const { amountOrTokenId, isApproveAll: isAll } = parseResult;
    const amountOrTokenIdHex = add0x(amountOrTokenId?.toString(16) ?? '0x0');

    const difference =
      isNFT || amountOrTokenId === undefined ? '0x1' : amountOrTokenIdHex;

    const tokenId = isNFT && amountOrTokenId ? amountOrTokenIdHex : undefined;

    const isUnlimited =
      !isNFT && isSpendingCapUnlimited(amountOrTokenId?.toNumber() ?? 0);

    const balanceChange: ApprovalBalanceChange = {
      address: to,
      difference,
      id: tokenId,
      isAll: isAll ?? false,
      isDecrease: true,
      isUnlimited,
      newBalance: '0x0',
      previousBalance: '0x0',
      standard,
    };

    balanceChanges.push(balanceChange);
  }

  return balanceChanges;
}
