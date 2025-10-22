import { BigNumber } from 'bignumber.js';
import { Hex } from '@metamask/utils';
import { Interface, TransactionDescription } from '@ethersproject/abi';
import {
  GenericQuoteRequest,
  isNativeAddress,
  QuoteResponse,
} from '@metamask/bridge-controller';
import { addHexPrefix } from 'ethereumjs-util';
import {
  SimulationData,
  SimulationTokenBalanceChange,
} from '@metamask/transaction-controller';
import { getNativeTokenAddress } from '@metamask/assets-controllers';

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

const COMMAND_BYTE_SWEEP = '04';
const COMMAND_BYTE_SEAPORT = '10';
const COMMAND_BYTE_UNWRAP_WETH = '0c';

function getArgsFromInput(input: string) {
  return input?.slice(2).match(/.{1,64}/gu) ?? [];
}

function argToAddress(arg?: string) {
  if (!arg) {
    return undefined;
  }
  return addHexPrefix(arg?.slice(24));
}

function argToAmount(arg?: string) {
  if (!arg) {
    return undefined;
  }
  const amount = arg?.replace(/^0+/u, '') || '0';
  return addHexPrefix(amount);
}

function parseTransactionData(data?: string) {
  const contractInterface = new Interface(ABI);

  let parsedTransactionData: TransactionDescription;

  try {
    parsedTransactionData = contractInterface.parseTransaction({
      data: data as Hex,
    });
  } catch (error) {
    return { inputs: [], commandBytes: [] };
  }

  const { commands } = parsedTransactionData.args;
  const { inputs } = parsedTransactionData.args;
  const commandBytes = commands.slice(2).match(/.{1,2}/gu) ?? [];

  return { inputs, commandBytes };
}

export function getDataFromSwap(chainId: Hex, data?: string) {
  let amountMin;
  const tokenAddresses = [];
  const { commandBytes, inputs } = parseTransactionData(data);
  console.log('---------------COMMAND BYTES---------------', commandBytes);
  console.log('---------------INPUTS---------------', inputs);

  const seaportIndex = commandBytes.findIndex(
    (commandByte: string) => commandByte === COMMAND_BYTE_SEAPORT,
  );
  let seaportArgs: string[] = [];
  let sweepArgs: string[] = [];
  let unwrapWethArgs: string[] = [];

  if (seaportIndex >= 0) {
    seaportArgs = getArgsFromInput(inputs[seaportIndex]);
    amountMin = argToAmount(seaportArgs[13]);
    tokenAddresses.push(argToAddress(seaportArgs[10]));
    tokenAddresses.push(argToAddress(seaportArgs[16]));
  }
  const sweepIndex = commandBytes.findIndex(
    (commandByte: string) => commandByte === COMMAND_BYTE_SWEEP,
  );

  if (sweepIndex >= 0) {
    sweepArgs = getArgsFromInput(inputs[sweepIndex]);
    amountMin = argToAmount(sweepArgs[2]);
  }
  const unwrapWethIndex = commandBytes.findIndex(
    (commandByte: string) => commandByte === COMMAND_BYTE_UNWRAP_WETH,
  );
  if (unwrapWethIndex >= 0) {
    unwrapWethArgs = getArgsFromInput(inputs[unwrapWethIndex]);
    amountMin = argToAmount(unwrapWethArgs[1]);
  }

  const quotesInput = {
    walletAddress: argToAddress(
      unwrapWethArgs[0] ?? sweepArgs[1] ?? seaportArgs[28],
    ),
    srcChainId: chainId,
    destChainId: chainId,
    srcTokenAddress: argToAddress(seaportArgs[10]),
    destTokenAddress:
      unwrapWethIndex >= 0
        ? getNativeTokenAddress(chainId)
        : argToAddress(seaportArgs[16]),
    srcTokenAmount: argToAmount(seaportArgs[12]),
    gasIncluded: false,
    gasIncluded7702: false,
  } as GenericQuoteRequest;

  return { quotesInput, amountMin, tokenAddresses };
}

export function getBestQuote(
  quotes: QuoteResponse[],
  getUSDValueForToken: (tokenAmount: string) => string,
  getGasUSDValue: (gasValue: BigNumber) => string,
): QuoteResponse | undefined {
  let selectedQuoteIndex = -1;
  let highestQuoteValue = new BigNumber(-1, 10);

  quotes.forEach((currentQuote, index) => {
    const { quote, approval, trade } = currentQuote;
    const quoteValue = new BigNumber(
      getUSDValueForToken(quote.destTokenAmount),
      10,
    ).minus(
      new BigNumber(
        getGasUSDValue(
          new BigNumber(
            (approval?.effectiveGas ?? approval?.gasLimit ?? 0) +
              (trade?.effectiveGas ?? trade?.gasLimit ?? 0),
            10,
          ),
        ),
        10,
      ),
    );

    if (quoteValue.greaterThan(highestQuoteValue)) {
      highestQuoteValue = quoteValue;
      selectedQuoteIndex = index;
    }
  });

  return selectedQuoteIndex > -1 ? quotes[selectedQuoteIndex] : undefined;
}

export function getTokenValueFromRecord(
  record: Record<Hex, number>,
  tokenAddress: Hex,
): number {
  const address = Object.keys(record).find((key) => {
    return key.toLowerCase() === tokenAddress.toLowerCase();
  });
  return address ? (record[address as Hex] ?? 0) : 0;
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
    balanceDifference = nativeBalanceChange?.difference ?? '0';
  } else {
    balanceDifference =
      tokenBalanceChanges.find(
        (change: SimulationTokenBalanceChange) =>
          change.address === tokenAddress,
      )?.difference ?? '0';
  }

  return (
    balanceDifference ? new BigNumber(balanceDifference, 16) : new BigNumber(0)
  ).toString(10);
}
