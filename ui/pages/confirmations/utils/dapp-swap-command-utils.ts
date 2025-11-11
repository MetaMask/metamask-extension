import { Hex } from '@metamask/utils';
import { GenericQuoteRequest } from '@metamask/bridge-controller';
import { Interface } from '@ethersproject/abi';
import { addHexPrefix } from 'ethereumjs-util';
import { getNativeTokenAddress } from '@metamask/assets-controllers';

const decodeV4SwapCommandData = (data: string) => {
  const abiDecoder = Interface.getAbiCoder();
  const values = abiDecoder.decode(['bytes', 'bytes[]'], data);
  return values;
};

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
    return { data: undefined, args: undefined };
  }

  return {
    data: inputs[commandIndex],
    args: getArgsFromInput(inputs[commandIndex]),
  };
}

function handleV4SwapCommand(
  _: string[],
  chainId: Hex,
  quotesInput: GenericQuoteRequest,
  data: string,
) {
  const decoded = decodeV4SwapCommandData(data);
  let commandBytes = decoded[0].slice(2).match(/.{1,2}/gu) ?? [];
  commandBytes = commandBytes.map((byte: string) => `10_${byte}`);
  const result = getCommandValues(commandBytes, decoded[1], chainId);

  return {
    amountMin: result.amountMin,
    isExactOut: result.isExactOut,
    quotesInput: {
      ...quotesInput,
      ...result.quotesInput,
    } as GenericQuoteRequest,
  };
}

function handleV4CommandSwapExactIn(
  args: string[],
  _1: Hex,
  quotesInput: GenericQuoteRequest,
  _2: string,
) {
  return {
    amountMin: argToAmount(args[4]),
    isExactOut: false,
    quotesInput: {
      ...quotesInput,
      srcTokenAmount: argToAmount(args[3]),
      srcTokenAddress: argToAddress(args[1]),
      destTokenAddress: argToAddress(args[7]),
    } as GenericQuoteRequest,
  };
}

function handleV4CommandSwapExactInSingle(
  args: string[],
  _1: Hex,
  quotesInput: GenericQuoteRequest,
  _2: string,
) {
  return {
    amountMin: argToAmount(args[9]),
    isExactOut: false,
    quotesInput: {
      ...quotesInput,
      srcTokenAmount: argToAmount(args[7]),
      srcTokenAddress: argToAddress(args[1]),
      destTokenAddress: argToAddress(args[2]),
    } as GenericQuoteRequest,
  };
}

function handleV4CommandTake(
  args: string[],
  _1: Hex,
  quotesInput: GenericQuoteRequest,
  _2: string,
) {
  return {
    amountMin: undefined,
    isExactOut: false,
    quotesInput: {
      ...quotesInput,
      walletAddress: argToAddress(args[1]),
    } as GenericQuoteRequest,
  };
}

function handleCommandSwapExactOut(
  _1: string[],
  _2: Hex,
  _3: GenericQuoteRequest,
  _4: string,
) {
  return {
    amountMin: undefined,
    isExactOut: true,
    quotesInput: {} as GenericQuoteRequest,
  };
}

const getTokenAddressesFromBytes = (args: string[]) => {
  let bytes = '';
  for (let i = 6; i < args.length; i++) {
    bytes += args[i];
  }
  bytes = bytes.replace(/(00)+$/, '');
  const slices = bytes.match(/.{1,46}/gu);
  const srcTokenAddress = `0x${slices?.[0].substring(0, 40)}`;
  const destTokenAddress = `0x${slices?.[slices.length - 1].substring(0, 40)}`;
  return { srcTokenAddress, destTokenAddress };
};

function handleV3SwapExactInCommand(
  args: string[],
  _chainId: Hex,
  quotesInput: GenericQuoteRequest,
  _data: string,
) {
  const { srcTokenAddress, destTokenAddress } =
    getTokenAddressesFromBytes(args);
  return {
    amountMin: argToAmount(args[2]),
    isExactOut: false,
    quotesInput: {
      ...quotesInput,
      walletAddress: argToAddress(args[0]),
      srcTokenAmount: argToAmount(args[1]),
      srcTokenAddress,
      destTokenAddress,
    } as GenericQuoteRequest,
  };
}

function handleWrapEthCommand(
  args: string[],
  chainId: Hex,
  quotesInput: GenericQuoteRequest,
  _data: string,
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
  _chainId: Hex,
  quotesInput: GenericQuoteRequest,
  _data: string,
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
  _chainId: Hex,
  quotesInput: GenericQuoteRequest,
  _data: string,
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
  _data: string,
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

const DAPP_SWAP_COMMANDS = [
  { value: '00', handler: handleV3SwapExactInCommand },
  { value: '01', handler: handleCommandSwapExactOut },
  { value: '10', handler: handleV4SwapCommand },
  { value: '0a', handler: handlePermit2PermitCommand },
  { value: '0b', handler: handleWrapEthCommand },
  { value: '04', handler: handleSweepCommand },
  { value: '0c', handler: handleUnwrapWethCommand },
  { value: '10_06', handler: handleV4CommandSwapExactInSingle },
  { value: '10_07', handler: handleV4CommandSwapExactIn },
  { value: '10_09', handler: handleCommandSwapExactOut },
  { value: '10_0e', handler: handleV4CommandTake },
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
  } as GenericQuoteRequest;

  let isExactOutRequest = false;

  DAPP_SWAP_COMMANDS.forEach((command) => {
    const { data, args } = getCommandArgs(commandBytes, inputs, command.value);
    if (data === undefined) {
      return;
    }
    const result = command.handler(args, chainId, quotesInput, data);
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
    return { isExactOut: true };
  }

  return {
    quotesInput,
    amountMin,
  };
}
