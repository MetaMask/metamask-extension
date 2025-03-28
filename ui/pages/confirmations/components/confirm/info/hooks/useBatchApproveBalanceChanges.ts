import {
  BatchTransactionParams,
  SimulationTokenBalanceChange,
  SimulationTokenStandard,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { add0x } from '@metamask/utils';
import { useConfirmContext } from '../../../../context/confirm';
import { useAsyncResult } from '../../../../../../hooks/useAsync';
import { getTokenStandardAndDetails } from '../../../../../../store/actions';
import { parseApprovalTransactionData } from '../../../../../../../shared/modules/transaction.utils';
import { useBalanceChanges } from '../../../simulation-details/useBalanceChanges';
import { BalanceChange } from '../../../simulation-details/types';
import { isSpendingCapUnlimited } from '../approve/hooks/use-approve-token-simulation';

type ApprovalSimulationBalanceChange = SimulationTokenBalanceChange & {
  isAll: boolean;
  isUnlimited: boolean;
  nestedTransactionIndex: number;
};

export type ApprovalBalanceChange = BalanceChange & {
  nestedTransactionIndex: number;
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

  const finalBalanceChanges = (balanceChanges ?? []).map<ApprovalBalanceChange>(
    (change, index) => {
      const simulation = simulationBalanceChanges?.[index];

      return {
        ...change,
        isApproval: true,
        isAllApproval: simulation?.isAll ?? false,
        isUnlimitedApproval: simulation?.isUnlimited ?? false,
        nestedTransactionIndex: simulation?.nestedTransactionIndex ?? -1,
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
}): Promise<ApprovalSimulationBalanceChange[]> {
  const balanceChanges: ApprovalSimulationBalanceChange[] = [];

  if (!nestedTransactions) {
    return balanceChanges;
  }

  for (let i = 0; i < nestedTransactions.length; i++) {
    const transaction = nestedTransactions[i];
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

    const balanceChange: ApprovalSimulationBalanceChange = {
      address: to,
      difference,
      id: tokenId,
      isAll: isAll ?? false,
      isDecrease: true,
      isUnlimited,
      newBalance: '0x0',
      nestedTransactionIndex: i,
      previousBalance: '0x0',
      standard,
    };

    balanceChanges.push(balanceChange);
  }

  return balanceChanges;
}
