import { Hex } from '@metamask/utils';
import { GenericQuoteRequest } from '@metamask/bridge-controller';
import { addHexPrefix } from 'ethereumjs-util';
import { getNativeTokenAddress } from '@metamask/assets-controllers';

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

function handleV4SwapCommand(
  args: string[],
  _: Hex,
  quotesInput: GenericQuoteRequest,
) {
  return {
    amountMin: argToAmount(args[13]),
    isExactOut: args[10] === args[27],
    quotesInput: {
      ...quotesInput,
      destTokenAddress: argToAddress(args[27]),
      srcTokenAddress: argToAddress(args[23]),
      srcTokenAmount: argToAmount(args[12]),
      walletAddress: argToAddress(args[28]),
    } as GenericQuoteRequest,
  };
}

function handleV3SwapExactInCommand(
  args: string[],
  _: Hex,
  quotesInput: GenericQuoteRequest,
) {
  const bytes = `${args[args.length - 2]}${args[args.length - 1]}`;
  return {
    amountMin: argToAmount(args[2]),
    isExactOut: false,
    quotesInput: {
      ...quotesInput,
      walletAddress: argToAddress(args[0]),
      srcTokenAmount: argToAmount(args[1]),
      destTokenAddress: `0x${bytes.substring(bytes.length - 82, bytes.length - 42)}`,
    } as GenericQuoteRequest,
  };
}

function handleWrapEthCommand(
  args: string[],
  chainId: Hex,
  quotesInput: GenericQuoteRequest,
) {
  return {
    amountMin: undefined,
    isExactOut: false,
    quotesInput: {
      ...quotesInput,
      srcTokenAddress: getNativeTokenAddress(chainId),
      srcTokenAmount: argToAmount(args[1]),
    } as GenericQuoteRequest,
  };
}

function handlePermit2PermitCommand(
  args: string[],
  _: Hex,
  quotesInput: GenericQuoteRequest,
) {
  return {
    amountMin: undefined,
    isExactOut: false,
    quotesInput: {
      ...quotesInput,
      srcTokenAddress: argToAddress(args[0]),
    } as GenericQuoteRequest,
  };
}

function handleSweepCommand(
  args: string[],
  _: Hex,
  quotesInput: GenericQuoteRequest,
) {
  return {
    amountMin: argToAmount(args[2]),
    isExactOut: false,
    quotesInput: {
      ...quotesInput,
      destTokenAddress: argToAddress(args[0]),
      walletAddress: argToAddress(args[1]),
    } as GenericQuoteRequest,
  };
}

function handleUnwrapWethCommand(
  args: string[],
  chainId: Hex,
  quotesInput: GenericQuoteRequest,
) {
  return {
    amountMin: argToAmount(args[1]),
    isExactOut: false,
    quotesInput: {
      ...quotesInput,
      destTokenAddress: getNativeTokenAddress(chainId),
      walletAddress: argToAddress(args[0]),
    } as GenericQuoteRequest,
  };
}

const V3_SWAP_EXACT_OUT = '01';

const DAPP_SWAP_COMMANDS = [
  { value: '00', handler: handleV3SwapExactInCommand },
  { value: '10', handler: handleV4SwapCommand },
  { value: '0a', handler: handlePermit2PermitCommand },
  { value: '0b', handler: handleWrapEthCommand },
  { value: '04', handler: handleSweepCommand },
  { value: '0c', handler: handleUnwrapWethCommand },
];

export function getCommandValues(
  commandBytes: string[],
  inputs: string[],
  chainId: Hex,
) {
  let amountMin;
  let quotesInput = {
    srcChainId: chainId,
    destChainId: chainId,
    gasIncluded: false,
    gasIncluded7702: false,
    fee: 250,
  } as GenericQuoteRequest;

  if (commandBytes.includes(V3_SWAP_EXACT_OUT)) {
    return {};
  }

  let isExactOutRequest = false;

  DAPP_SWAP_COMMANDS.forEach((command) => {
    const args = getCommandArgs(commandBytes, inputs, command.value);
    if (args === undefined) {
      return;
    }

    const result = command.handler(args, chainId, quotesInput);
    if (result) {
      if (result.isExactOut === true) {
        isExactOutRequest = true;
      }
      if (result.amountMin !== undefined) {
        amountMin = result.amountMin;
      }
      if (result.quotesInput) {
        quotesInput = result.quotesInput;
      }
    }
  });

  if (isExactOutRequest) {
    return {};
  }

  return {
    quotesInput,
    amountMin,
  };
}
