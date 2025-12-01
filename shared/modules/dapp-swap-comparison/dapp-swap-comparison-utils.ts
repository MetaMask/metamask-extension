import { BigNumber } from 'bignumber.js';
import { Hex } from '@metamask/utils';
import { Interface, TransactionDescription } from '@ethersproject/abi';
import {
  isNativeAddress,
  QuoteResponse,
  TxData,
} from '@metamask/bridge-controller';
import {
  NestedTransactionMetadata,
  SimulationData,
  SimulationTokenBalanceChange,
} from '@metamask/transaction-controller';
import { parseApprovalTransactionData } from '../transaction.utils';
import { getCommandValues } from './dapp-swap-command-utils';

export const ABI = [
  {
    constant: true,
    inputs: [
      {
        name: 'commands',
        type: 'bytes',
      },
      {
        name: 'inputs',
        type: 'bytes[]',
      },
      {
        name: 'deadline',
        type: 'uint256',
      },
    ],
    name: 'execute',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: 'commands',
        type: 'bytes',
      },
      {
        name: 'inputs',
        type: 'bytes[]',
      },
    ],
    name: 'execute',
    type: 'function',
  },
];

export function parseTransactionData(data?: string) {
  const contractInterface = new Interface(ABI);

  let parsedTransactionData: TransactionDescription;

  try {
    parsedTransactionData = contractInterface.parseTransaction({
      data: data as Hex,
    });
  } catch (error) {
    return { inputs: [], commandBytes: [], commands: '' };
  }

  const { commands, inputs } = parsedTransactionData.args;
  const commandBytes = commands.slice(2).match(/.{1,2}/gu) ?? [];

  return { commands, commandBytes, inputs };
}

export function getDataFromSwap(
  chainId: Hex,
  commandBytes: string[],
  inputs: string[],
) {
  return getCommandValues(commandBytes, inputs, chainId);
}

export function getBestQuote(
  quotes: QuoteResponse[],
  amountMin: string,
  getUSDValueForToken: (tokenAmount: string) => string,
  getGasUSDValue: (gasValue: BigNumber) => string,
): {
  bestQuote: QuoteResponse | undefined;
  bestFilteredQuote: QuoteResponse | undefined;
} {
  let selectedQuoteIndex = -1;
  let bestFilteredQuoteIndex = -1;
  let highestQuoteValue = new BigNumber(-1, 10);
  let minBelowAmountMin = true;

  quotes.forEach((currentQuote, index) => {
    const { quote, approval, trade } = currentQuote;
    const destTokenAmountInQuote = new BigNumber(
      getUSDValueForToken(quote.destTokenAmount),
      10,
    );
    const totalGasInQuote = new BigNumber(
      getGasUSDValue(
        new BigNumber(
          ((approval as TxData)?.effectiveGas ??
            (approval as TxData)?.gasLimit ??
            0) +
            ((trade as TxData)?.effectiveGas ??
              (trade as TxData)?.gasLimit ??
              0),
          10,
        ),
      ),
      10,
    );
    const quoteValue = destTokenAmountInQuote.minus(totalGasInQuote);
    const quoteMinGreaterThanAmountMin = new BigNumber(
      quote.minDestTokenAmount,
      10,
    ).greaterThanOrEqualTo(new BigNumber(amountMin, 16));

    if (
      (minBelowAmountMin && quoteMinGreaterThanAmountMin) ||
      (quoteValue.greaterThan(highestQuoteValue) &&
        (minBelowAmountMin || quoteMinGreaterThanAmountMin))
    ) {
      minBelowAmountMin = !quoteMinGreaterThanAmountMin;
      highestQuoteValue = quoteValue;
      selectedQuoteIndex = index;
      if (quoteMinGreaterThanAmountMin) {
        bestFilteredQuoteIndex = index;
      }
    }
  });

  return {
    bestQuote: selectedQuoteIndex > -1 ? quotes[selectedQuoteIndex] : undefined,
    bestFilteredQuote:
      bestFilteredQuoteIndex > -1 ? quotes[bestFilteredQuoteIndex] : undefined,
  };
}

export function getBalanceChangeFromSimulationData(
  tokenAddress: Hex,
  simulationData?: SimulationData,
): string {
  if (!simulationData) {
    return '0';
  }

  const { nativeBalanceChange, tokenBalanceChanges } = simulationData;
  let balanceDifference = '0x0';
  if (isNativeAddress(tokenAddress)) {
    balanceDifference = nativeBalanceChange?.difference ?? '0x0';
  } else {
    balanceDifference =
      tokenBalanceChanges.find(
        (change: SimulationTokenBalanceChange) =>
          change.address === tokenAddress,
      )?.difference ?? '0x0';
  }

  return new BigNumber(balanceDifference, 16).toString(10);
}

const FOUR_BYTE_EXECUTE_SWAP_CONTRACT = '0x3593564c';
const PERMIT2_APPROVE_TRANSACTION = '0x87517c45';
const ERC20_APPROVE_TRANSACTION = '0x095ea7b3';
const validSwapBatchTransactionCommands = [
  FOUR_BYTE_EXECUTE_SWAP_CONTRACT,
  PERMIT2_APPROVE_TRANSACTION,
  ERC20_APPROVE_TRANSACTION,
];

export function checkValidSingleOrBatchTransaction(
  nestedTransactions?: NestedTransactionMetadata[],
  approveTokenAddress?: Hex,
) {
  if (!nestedTransactions || nestedTransactions?.length === 0) {
    return;
  }

  if (nestedTransactions.length > 3) {
    throw new Error(
      'Error getting data from swap: invalid batch transaction maximum 3 nested transactions allowed',
    );
  }

  if (
    nestedTransactions.some(
      ({ data }) =>
        !validSwapBatchTransactionCommands.some((command) =>
          data?.startsWith(command),
        ),
    )
  ) {
    throw new Error(
      'Error getting data from swap: invalid batch transaction, invalid command',
    );
  }

  const trade = nestedTransactions.filter(({ data }) =>
    data?.startsWith(FOUR_BYTE_EXECUTE_SWAP_CONTRACT),
  );
  if (trade?.length !== 1) {
    throw new Error(
      `Error getting data from swap: invalid batch transaction, ${trade?.length} trade(s) found.`,
    );
  }

  const permit2Approvals = nestedTransactions.filter(({ data }) =>
    data?.startsWith(PERMIT2_APPROVE_TRANSACTION),
  );
  const permit2ApprovalParsed = parseApprovalTransactionData(
    permit2Approvals[0]?.data as Hex,
  );
  if (
    permit2Approvals.length > 1 ||
    (permit2Approvals.length === 1 &&
      (permit2ApprovalParsed?.tokenAddress?.toLowerCase() !==
        approveTokenAddress?.toLowerCase() ||
        permit2ApprovalParsed?.spender?.toLowerCase() !==
          trade[0].to?.toLowerCase()))
  ) {
    throw new Error(
      'Error getting data from swap: invalid batch transaction, unexpected permit2 approval',
    );
  }

  const erc20Approvals = nestedTransactions.filter(({ data }) =>
    data?.startsWith(ERC20_APPROVE_TRANSACTION),
  );
  if (!erc20Approvals?.length) {
    return;
  }
  const erc20ApprovalParsed = parseApprovalTransactionData(
    erc20Approvals[0]?.data as Hex,
  );
  if (
    erc20Approvals.length > 1 ||
    (permit2Approvals.length === 1 &&
      erc20ApprovalParsed?.spender?.toLowerCase() !==
        permit2Approvals[0]?.to?.toLowerCase()) ||
    (permit2Approvals.length === 0 &&
      erc20Approvals.length === 1 &&
      erc20ApprovalParsed?.spender?.toLowerCase() !==
        trade[0].to?.toLowerCase())
  ) {
    throw new Error(
      'Error getting data from swap: invalid batch transaction, unexpected erc20 approval',
    );
  }
}
