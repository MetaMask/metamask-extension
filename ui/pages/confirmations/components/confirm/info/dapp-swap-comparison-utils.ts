import { Hex } from '@metamask/utils';
import { Interface, TransactionDescription } from '@ethersproject/abi';
import { QuoteResponse } from '@metamask/bridge-controller';
import { addHexPrefix } from 'ethereumjs-util';
import { getNativeTokenAddress } from '@metamask/assets-controllers';

import { Numeric } from '../../../../../../shared/modules/Numeric';

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

const getWordsFromInput = (input: string) => {
  return input.slice(2).match(/.{1,64}/gu) as string[];
};

const wordToAddress = (word: string) => {
  return addHexPrefix(word.slice(24));
};

const wordToAmount = (word: string) => {
  const amount = word.replace(/^0+/u, '');
  return addHexPrefix(amount);
};

const parseTransactionData = (data?: string) => {
  const contractInterface = new Interface(ABI);

  let parsedTransactionData: TransactionDescription;

  try {
    parsedTransactionData = contractInterface.parseTransaction({
      data: data as Hex,
    });
  } catch (error) {
    return { inputs: [], commandBytes: [] };
  }

  const commands = parsedTransactionData.args.commands as string;
  const inputs = parsedTransactionData.args.inputs as string[];
  const commandBytes = commands.slice(2).match(/.{1,2}/gu) as string[];

  return { inputs, commandBytes };
};

export const getDataFromSwap = (
  chainId: Hex,
  amount?: string,
  data?: string,
) => {
  let quotesInput;
  let amountMin;
  const erc20TokenAddresses = [];
  const { commandBytes, inputs } = parseTransactionData(data);

  const sweepIndex = commandBytes.findIndex(
    (commandByte) => commandByte === '04',
  );

  if (sweepIndex >= 0) {
    const words = getWordsFromInput(inputs[sweepIndex]);
    amountMin = wordToAmount(words[2]);
    erc20TokenAddresses.push(wordToAddress(words[0]));
    quotesInput = {
      walletAddress: wordToAddress(words[1]),
      srcChainId: chainId,
      destChainId: chainId,
      srcTokenAddress: getNativeTokenAddress(chainId),
      destTokenAddress: wordToAddress(words[0]),
      srcTokenAmount: amount ?? '0x0',
      gasIncluded: false,
      gasIncluded7702: false,
    };
  } else {
    const seaportIndex = commandBytes.findIndex(
      (commandByte) => commandByte === '10',
    );

    if (seaportIndex >= 0) {
      const words = getWordsFromInput(inputs[seaportIndex]);
      amountMin = wordToAmount(words[13]);
      erc20TokenAddresses.push(wordToAddress(words[10]));
      erc20TokenAddresses.push(wordToAddress(words[16]));
      quotesInput = {
        walletAddress: wordToAddress(words[28]),
        srcChainId: chainId,
        destChainId: chainId,
        srcTokenAddress: wordToAddress(words[10]),
        destTokenAddress: wordToAddress(words[16]),
        srcTokenAmount: wordToAmount(words[12]),
        gasIncluded: false,
        gasIncluded7702: false,
      };
    }
  }

  return { quotesInput, amountMin, erc20TokenAddresses };
};

export const getBestQuote = (quotes: QuoteResponse[]) => {
  let selectedQuoteIndex = -1;
  let highestMinDestTokenAmount = '0';

  quotes.forEach((quote, index) => {
    if (
      new Numeric(quote.quote.minDestTokenAmount, 10).greaterThan(
        new Numeric(highestMinDestTokenAmount, 10),
      )
    ) {
      highestMinDestTokenAmount = quote.quote.minDestTokenAmount;
      selectedQuoteIndex = index;
    }
  });

  return selectedQuoteIndex > -1 ? quotes[selectedQuoteIndex] : undefined;
};

export const getTokenValueFromRecord = (
  record: Record<Hex, number>,
  tokenAddress: Hex,
): number => {
  const address = Object.keys(record).find((key) => {
    return key.toLowerCase() === tokenAddress.toLowerCase();
  });
  return address ? (record[address as Hex] ?? 0) : 0;
};
