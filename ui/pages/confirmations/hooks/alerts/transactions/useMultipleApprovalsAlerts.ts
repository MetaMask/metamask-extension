import {
  NestedTransactionMetadata,
  SimulationErrorCode,
  SimulationTokenBalanceChange,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TokenStandard } from '../../../../../../shared/constants/transaction';
import { parseApprovalTransactionData } from '../../../../../../shared/modules/transaction.utils';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useAsyncResult } from '../../../../../hooks/useAsync';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getTokenStandardAndDetailsByChain } from '../../../../../store/actions';
import { useBatchApproveBalanceChanges } from '../../../components/confirm/info/hooks/useBatchApproveBalanceChanges';
import { useConfirmContext } from '../../../context/confirm';
import {
  getUseTransactionSimulations,
  selectMultipleApprovalAlertAllowList,
} from '../../../../../selectors';

type ApprovalInfo = {
  tokenAddress: Hex;
  spenderAddress?: Hex;
  amount?: BigNumber;
};

type TokenOutflow = {
  tokenAddress: Hex;
  amount: BigNumber;
  isDecrease: boolean;
};

function getUniqueTokenAddresses(
  nestedTransactions: NestedTransactionMetadata[],
): Hex[] {
  const addresses = new Set<Hex>();

  nestedTransactions.forEach((transaction) => {
    const { data, to } = transaction;
    if (!data || !to) {
      return;
    }

    const parseResult = parseApprovalTransactionData(data);
    if (!parseResult) {
      return;
    }

    const { name, tokenAddress } = parseResult;

    let actualTokenAddress: Hex;
    switch (name) {
      case 'approve':
        actualTokenAddress = tokenAddress || to;
        break;
      case 'increaseAllowance':
      case 'setApprovalForAll':
        actualTokenAddress = to;
        break;
      default:
        return;
    }

    addresses.add(actualTokenAddress);
  });

  return Array.from(addresses);
}

function shouldSkipApproval(
  parseResult: ReturnType<typeof parseApprovalTransactionData>,
  tokenStandards: Record<Hex, TokenStandard>,
  tokenAddress: Hex,
): boolean {
  if (!parseResult) {
    return true;
  }

  // Skip setApprovalForAll revocations
  if (parseResult.isRevokeAll) {
    return true;
  }

  // Check if this is a revocation based on token standard
  if (parseResult.amountOrTokenId?.isZero()) {
    const tokenStandard = tokenStandards[tokenAddress];

    // Only skip zero amounts for ERC20 tokens (revocations)
    // For ERC721/ERC1155, token ID 0 is valid and should not be skipped
    if (tokenStandard === TokenStandard.ERC20) {
      return true;
    }
    // For unknown token standards or NFTs, we don't skip to avoid false negatives
  }

  return false;
}

function extractApprovals(
  nestedTransactions: NestedTransactionMetadata[],
  tokenStandards: Record<Hex, TokenStandard>,
): ApprovalInfo[] {
  const approvalsList: ApprovalInfo[] = [];

  nestedTransactions.forEach((transaction) => {
    const { data, to } = transaction;
    if (!data || !to) {
      return;
    }

    const parseResult = parseApprovalTransactionData(data);
    if (!parseResult) {
      return;
    }

    const { name, amountOrTokenId, tokenAddress } = parseResult;

    let actualTokenAddress: Hex;
    let spenderAddress: Hex | undefined;

    switch (name) {
      case 'approve':
        if (tokenAddress) {
          // Permit2 approve
          actualTokenAddress = tokenAddress;
          spenderAddress = to;
        } else {
          // Regular ERC20/ERC721 approve
          actualTokenAddress = to;
        }
        break;
      case 'increaseAllowance':
      case 'setApprovalForAll':
        actualTokenAddress = to;
        break;
      default:
        return;
    }

    if (shouldSkipApproval(parseResult, tokenStandards, actualTokenAddress)) {
      return;
    }

    approvalsList.push({
      tokenAddress: actualTokenAddress,
      spenderAddress,
      amount: amountOrTokenId,
    });
  });

  return approvalsList;
}

function getTokensWithDecrease(
  simulationDataArray: SimulationTokenBalanceChange[],
): TokenOutflow[] {
  return (
    simulationDataArray
      ?.filter((change) => change.isDecrease)
      .map((change) => ({
        tokenAddress: change.address.toLowerCase() as Hex,
        amount: new BigNumber(change.difference, 16),
        isDecrease: change.isDecrease,
      })) ?? []
  );
}

function findUnusedApprovals(
  approvals: ApprovalInfo[],
  tokenOutflows: TokenOutflow[],
): ApprovalInfo[] {
  if (approvals.length === 0) {
    return [];
  }

  return approvals.filter((approval) => {
    const tokenOutflow = tokenOutflows.find(
      (outflow) =>
        outflow.tokenAddress.toLowerCase() ===
        approval.tokenAddress.toLowerCase(),
    );

    if (!tokenOutflow) {
      return true;
    }

    // If there's an outflow but the approval amount is much larger than needed,
    // we might still want to flag it, but for now we'll only flag completely unused approvals
    return false;
  });
}

// Utility function to fetch token standards for addresses
async function fetchTokenStandards(
  tokenAddresses: Hex[],
  chainId: string | undefined,
  fromAddress: Hex | undefined,
): Promise<Record<Hex, TokenStandard>> {
  if (!tokenAddresses.length || !chainId || !fromAddress) {
    return {};
  }

  const standards: Record<Hex, TokenStandard> = {};
  await Promise.all(
    tokenAddresses.map(async (address) => {
      try {
        const details = await getTokenStandardAndDetailsByChain(
          address,
          fromAddress,
          undefined,
          chainId,
        );
        // Safely cast the string to TokenStandard enum
        const standard = details?.standard as TokenStandard;
        standards[address] = Object.values(TokenStandard).includes(standard)
          ? standard
          : TokenStandard.none;
      } catch (error) {
        console.warn(`Failed to get token standard for ${address}:`, error);
        standards[address] = TokenStandard.none;
      }
    }),
  );

  return standards;
}

export function useMultipleApprovalsAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { value: approveBalanceChanges } =
    useBatchApproveBalanceChanges() ?? {};

  const isSimulationEnabled = useSelector(getUseTransactionSimulations);
  const multipleApprovalAlertAllowList = useSelector(
    selectMultipleApprovalAlertAllowList,
  ) as string[] | undefined;

  const nestedTransactions = currentConfirmation?.nestedTransactions;
  const simulationData = currentConfirmation?.simulationData;
  const simulationDataArray = simulationData?.tokenBalanceChanges;
  const isSimulationSupported =
    isSimulationEnabled &&
    ![
      SimulationErrorCode.ChainNotSupported,
      SimulationErrorCode.Disabled,
    ].includes(simulationData?.error?.code as SimulationErrorCode);
  const skipAlertOriginAllowed = multipleApprovalAlertAllowList?.includes(
    currentConfirmation?.origin ?? '',
  );

  const tokenAddresses = useMemo(() => {
    if (!nestedTransactions?.length) {
      return [];
    }
    return getUniqueTokenAddresses(nestedTransactions);
  }, [nestedTransactions]);

  const { value: tokenStandards } = useAsyncResult(async () => {
    return fetchTokenStandards(
      tokenAddresses,
      currentConfirmation?.chainId,
      currentConfirmation?.txParams?.from as Hex,
    );
  }, [
    tokenAddresses,
    currentConfirmation?.chainId,
    currentConfirmation?.txParams?.from,
  ]);

  const approvals = useMemo((): ApprovalInfo[] => {
    if (
      !nestedTransactions?.length ||
      !approveBalanceChanges?.length ||
      !tokenStandards
    ) {
      return [];
    }

    const approvalsList = extractApprovals(nestedTransactions, tokenStandards);

    return approvalsList;
  }, [approveBalanceChanges, nestedTransactions, tokenStandards]);

  const tokenOutflows = useMemo(() => {
    if (!simulationDataArray) {
      return [];
    }
    return getTokensWithDecrease(simulationDataArray);
  }, [simulationDataArray]);

  const unusedApprovals = useMemo(() => {
    return findUnusedApprovals(approvals, tokenOutflows);
  }, [approvals, tokenOutflows]);

  const shouldShowAlert =
    unusedApprovals.length > 0 &&
    Boolean(currentConfirmation?.simulationData) &&
    isSimulationSupported &&
    !skipAlertOriginAllowed;

  return useMemo(() => {
    if (!shouldShowAlert) {
      return [];
    }

    return [
      {
        field: RowAlertKey.EstimatedChangesStatic,
        isBlocking: false,
        key: 'multipleApprovals',
        reason: t('alertReasonMultipleApprovals'),
        content: t('alertContentMultipleApprovals'),
        severity: Severity.Danger,
      },
    ];
  }, [shouldShowAlert, t]);
}
