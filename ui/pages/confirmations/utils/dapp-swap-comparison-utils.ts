import { BigNumber } from 'bignumber.js';
import { Hex } from '@metamask/utils';
import { Interface, TransactionDescription } from '@ethersproject/abi';
import { QuoteResponse } from '@metamask/bridge-controller';
import { addHexPrefix } from 'ethereumjs-util';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import {
  SimulationData,
  SimulationTokenBalanceChange,
} from '@metamask/transaction-controller';

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

function getArgsFromInput(input: string) {
  return input?.slice(2).match(/.{1,64}/gu) ?? [];
}

function argToAddress(arg?: string) {
  if (!arg) {
    return '';
  }
  return addHexPrefix(arg?.slice(24));
}

function argToAmount(arg?: string) {
  if (!arg) {
    return '';
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

export function getDataFromSwap(chainId: Hex, amount?: string, data?: string) {
  let quotesInput;
  let amountMin;
  const erc20TokenAddresses = [];
  const { commandBytes, inputs } = parseTransactionData(data);

  const sweepIndex = commandBytes.findIndex(
    (commandByte: string) => commandByte === COMMAND_BYTE_SWEEP,
  );

  if (sweepIndex >= 0) {
    const args = getArgsFromInput(inputs[sweepIndex]);
    amountMin = argToAmount(args[2]);
    erc20TokenAddresses.push(argToAddress(args[0]));
    quotesInput = {
      walletAddress: argToAddress(args[1]),
      srcChainId: chainId,
      destChainId: chainId,
      srcTokenAddress: getNativeTokenAddress(chainId),
      destTokenAddress: argToAddress(args[0]),
      srcTokenAmount: amount ?? '0x0',
      gasIncluded: false,
      gasIncluded7702: false,
    };
  } else {
    const seaportIndex = commandBytes.findIndex(
      (commandByte: string) => commandByte === COMMAND_BYTE_SEAPORT,
    );

    if (seaportIndex >= 0) {
      const args = getArgsFromInput(inputs[seaportIndex]);
      amountMin = argToAmount(args[13]);
      erc20TokenAddresses.push(argToAddress(args[10]));
      erc20TokenAddresses.push(argToAddress(args[16]));
      quotesInput = {
        walletAddress: argToAddress(args[28]),
        srcChainId: chainId,
        destChainId: chainId,
        srcTokenAddress: argToAddress(args[10]),
        destTokenAddress: argToAddress(args[16]),
        srcTokenAmount: argToAmount(args[12]),
        gasIncluded: false,
        gasIncluded7702: false,
      };
    }
  }

  return { quotesInput, amountMin, erc20TokenAddresses };
}

export function getBestQuote(
  quotes: QuoteResponse[],
): QuoteResponse | undefined {
  let selectedQuoteIndex = -1;
  let highestMinDestTokenAmount = '-1';

  quotes.forEach((quote, index) => {
    if (
      new BigNumber(quote.quote.minDestTokenAmount, 10).greaterThan(
        new BigNumber(highestMinDestTokenAmount, 10),
      )
    ) {
      highestMinDestTokenAmount = quote.quote.minDestTokenAmount;
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

  const { tokenBalanceChanges } = simulationData;
  const balanceChange = tokenBalanceChanges.find(
    (change: SimulationTokenBalanceChange) => change.address === tokenAddress,
  );
  return (
    balanceChange
      ? new BigNumber(balanceChange.difference, 16)
      : new BigNumber(0)
  ).toString(10);
}
