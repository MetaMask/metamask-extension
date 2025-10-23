import { BigNumber } from 'bignumber.js';
import { Hex } from '@metamask/utils';
import { Interface, TransactionDescription } from '@ethersproject/abi';
import {
  GenericQuoteRequest,
  isNativeAddress,
  QuoteResponse,
  TxData,
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

function getCommandArgs(
  commandBytes: string[],
  inputs: string[],
  command: string,
) {
  const commandIndex = commandBytes.findIndex(
    (commandByte: string) => commandByte === command,
  );
  if (commandIndex < 0) {
    return undefined;
  }
  return getArgsFromInput(inputs[commandIndex]);
}

function addSeaportCommandValues(
  commandBytes: string[],
  inputs: string[],
  quotesInput: GenericQuoteRequest,
) {
  const seaportArgs = getCommandArgs(
    commandBytes,
    inputs,
    COMMAND_BYTE_SEAPORT,
  );
  if (seaportArgs === undefined) {
    return undefined;
  }

  return {
    amountMin: argToAmount(seaportArgs[13]),
    quotesInput: {
      ...quotesInput,
      destTokenAddress: argToAddress(seaportArgs[16]),
      srcTokenAddress: argToAddress(seaportArgs[10]),
      srcTokenAmount: argToAmount(seaportArgs[12]),
      walletAddress: argToAddress(seaportArgs[28]),
    } as GenericQuoteRequest,
  };
}

function addSweepCommandValues(
  commandBytes: string[],
  inputs: string[],
  quotesInput: GenericQuoteRequest,
) {
  const sweepArgs = getCommandArgs(commandBytes, inputs, COMMAND_BYTE_SWEEP);
  if (sweepArgs === undefined) {
    return undefined;
  }

  return {
    amountMin: argToAmount(sweepArgs[2]),
    quotesInput: {
      ...quotesInput,
      destTokenAddress: argToAddress(sweepArgs[0]),
      walletAddress: argToAddress(sweepArgs[1]),
    } as GenericQuoteRequest,
  };
}

function addUnwrapWethCommandValues(
  commandBytes: string[],
  inputs: string[],
  chainId: Hex,
  quotesInput: GenericQuoteRequest,
) {
  const unwrapWethArgs = getCommandArgs(
    commandBytes,
    inputs,
    COMMAND_BYTE_UNWRAP_WETH,
  );
  if (unwrapWethArgs === undefined) {
    return undefined;
  }

  return {
    amountMin: argToAmount(unwrapWethArgs[1]),
    quotesInput: {
      ...quotesInput,
      destTokenAddress: getNativeTokenAddress(chainId),
      walletAddress: argToAddress(unwrapWethArgs[0]),
    } as GenericQuoteRequest,
  };
}

export function getDataFromSwap(chainId: Hex, data?: string) {
  const { commandBytes, inputs } = parseTransactionData(data);

  let amountMin;
  let quotesInput = {
    srcChainId: chainId,
    destChainId: chainId,
    gasIncluded: false,
    gasIncluded7702: false,
  } as GenericQuoteRequest;

  const seaportResult = addSeaportCommandValues(
    commandBytes,
    inputs,
    quotesInput,
  );
  if (seaportResult) {
    amountMin = seaportResult.amountMin;
    quotesInput = seaportResult.quotesInput;
  } else {
    return { quotesInput: undefined, amountMin: undefined, tokenAddresses: [] };
  }

  const sweepResult = addSweepCommandValues(commandBytes, inputs, quotesInput);
  if (sweepResult) {
    amountMin = sweepResult.amountMin;
    quotesInput = sweepResult.quotesInput;
  }

  const unwrapWethResult = addUnwrapWethCommandValues(
    commandBytes,
    inputs,
    chainId,
    quotesInput,
  );
  if (unwrapWethResult) {
    amountMin = unwrapWethResult.amountMin;
    quotesInput = unwrapWethResult.quotesInput;
  }

  return {
    quotesInput,
    amountMin,
    tokenAddresses: [quotesInput.destTokenAddress, quotesInput.srcTokenAddress],
  };
}

export function getBestQuote(
  quotes: QuoteResponse[],
  amountMin: string,
  getUSDValueForToken: (tokenAmount: string) => string,
  getGasUSDValue: (gasValue: BigNumber) => string,
): QuoteResponse | undefined {
  let selectedQuoteIndex = -1;
  let highestQuoteValue = new BigNumber(-1, 10);
  let minBelowAmountMin = true;
  const amountMinInUSD = new BigNumber(
    getUSDValueForToken(new BigNumber(amountMin, 16).toString(10)),
    10,
  );

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
    ).greaterThanOrEqualTo(amountMinInUSD);

    if (
      (minBelowAmountMin && quoteMinGreaterThanAmountMin) ||
      (quoteValue.greaterThan(highestQuoteValue) &&
        (minBelowAmountMin || quoteMinGreaterThanAmountMin))
    ) {
      minBelowAmountMin = !quoteMinGreaterThanAmountMin;
      highestQuoteValue = quoteValue;
      selectedQuoteIndex = index;
    }
  });

  return selectedQuoteIndex > -1 ? quotes[selectedQuoteIndex] : undefined;
}

export function getTokenValueFromRecord<Type>(
  record: Record<Hex, Type>,
  tokenAddress: Hex,
): Type | undefined {
  const address = Object.keys(record).find((key) => {
    return key.toLowerCase() === tokenAddress.toLowerCase();
  });
  return address ? record[address as Hex] : undefined;
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
