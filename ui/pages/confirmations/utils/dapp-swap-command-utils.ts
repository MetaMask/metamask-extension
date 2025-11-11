import { GenericQuoteRequest } from '@metamask/bridge-controller';
import { Hex } from '@metamask/utils';
import { Interface } from '@ethersproject/abi';

import { UNISWAP_ROUTER_COMMANDS } from '../../../../app/scripts/lib/transaction/decode/uniswap-commands';

export enum Actions {
  // swapping
  SWAP_EXACT_IN_SINGLE = 0x06,
  SWAP_EXACT_IN = 0x07,
  SWAP_EXACT_OUT_SINGLE = 0x08,
  SWAP_EXACT_OUT = 0x09,
}

const POOL_KEY_STRUCT =
  '(address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks)';

const PATH_KEY_STRUCT =
  '(address intermediateCurrency,uint256 fee,int24 tickSpacing,address hooks,bytes hookData)';

const SWAP_EXACT_IN_SINGLE_STRUCT =
  '(' +
  POOL_KEY_STRUCT +
  ' poolKey,bool zeroForOne,uint128 amountIn,uint128 amountOutMinimum,bytes hookData)';

const SWAP_EXACT_IN_STRUCT =
  '(address currencyIn,' +
  PATH_KEY_STRUCT +
  '[] path,uint128 amountIn,uint128 amountOutMinimum)';

const SWAP_EXACT_OUT_SINGLE_STRUCT =
  '(' +
  POOL_KEY_STRUCT +
  ' poolKey,bool zeroForOne,uint128 amountOut,uint128 amountInMaximum,bytes hookData)';

const SWAP_EXACT_OUT_STRUCT =
  '(address currencyOut,' +
  PATH_KEY_STRUCT +
  '[] path,uint128 amountOut,uint128 amountInMaximum)';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const V4_BASE_ACTIONS_ABI_DEFINITION: {} = {
  // Swapping commands
  [Actions.SWAP_EXACT_IN_SINGLE]: [
    {
      name: 'swap',
      type: SWAP_EXACT_IN_SINGLE_STRUCT,
    },
  ],
  [Actions.SWAP_EXACT_IN]: [
    {
      name: 'swap',
      type: SWAP_EXACT_IN_STRUCT,
    },
  ],
  [Actions.SWAP_EXACT_OUT_SINGLE]: [
    {
      name: 'swap',
      type: SWAP_EXACT_OUT_SINGLE_STRUCT,
    },
  ],
  [Actions.SWAP_EXACT_OUT]: [
    {
      name: 'swap',
      type: SWAP_EXACT_OUT_STRUCT,
    },
  ],
};

const decodeV4SwapCommandData = (data: string) => {
  const abiDecoder = Interface.getAbiCoder();
  const values = abiDecoder.decode(['bytes', 'bytes[]'], data);
  return values;
};

const decodeCommandData = (action: any, data: string) => {
  const abiDecoder = Interface.getAbiCoder();
  const values = abiDecoder.decode(
    (
      V4_BASE_ACTIONS_ABI_DEFINITION[
        action as keyof typeof V4_BASE_ACTIONS_ABI_DEFINITION
      ] as any
    ).map((v: any) => v.type),
    data,
  );
  return values[0];
};

const decodeCommandDataV3 = (action: string, data: string) => {
  const definition =
    UNISWAP_ROUTER_COMMANDS[
      String(action) as keyof typeof UNISWAP_ROUTER_COMMANDS
    ];
  const types = definition.params.map((param) => param.type);
  const abiDecoder = Interface.getAbiCoder();
  const values = abiDecoder.decode(types, data);
  return values;
};

function getCommandData(
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

  return inputs[commandIndex];
}

function handleV4SwapCommand(
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
      ...(quotesInput ?? {}),
      ...result.quotesInput,
    } as GenericQuoteRequest,
  };
}

function handleV4CommandSwapExactIn(
  _1: Hex,
  quotesInput: GenericQuoteRequest,
  data: string,
) {
  const result = decodeCommandData(Actions.SWAP_EXACT_IN, data);
  return {
    amountMin: result.amountOutMinimum.toNumber(),
    isExactOut: false,
    quotesInput: {
      ...(quotesInput ?? {}),
      srcTokenAmount: result.amountIn.toString(),
      srcTokenAddress: result.currencyIn,
      destTokenAddress: result.path[1][0],
    } as GenericQuoteRequest,
  };
}

function handleV4CommandSwapExactInSingle(
  _1: Hex,
  quotesInput: GenericQuoteRequest,
  data: string,
) {
  const result = decodeCommandData(Actions.SWAP_EXACT_IN_SINGLE, data);
  return {
    amountMin: result.amountOutMinimum.toNumber(),
    isExactOut: false,
    quotesInput: {
      ...(quotesInput ?? {}),
      srcTokenAmount: result.amountIn.toString(),
      srcTokenAddress: result[0][0],
      destTokenAddress: result[0][1],
    } as GenericQuoteRequest,
  };
}

function handleCommandSwapExactOut(
  _2: Hex,
  _3: GenericQuoteRequest,
  _4: string,
) {
  return {
    amountMin: undefined,
    isExactOut: true,
    quotesInput: undefined,
  };
}

const getTokenAddressesFromBytes = (args: string[]) => {
  let bytes = '';
  for (let i = 6; i < args.length; i++) {
    bytes += args[i];
  }
  bytes = bytes.replace(/(00)+$/u, '');
  const slices = bytes.match(/.{1,46}/gu);
  const srcTokenAddress = `0x${slices?.[0].substring(0, 40)}`;
  const destTokenAddress = `0x${slices?.[slices.length - 1].substring(0, 40)}`;
  return { srcTokenAddress, destTokenAddress };
};

function handleV3SwapExactInCommand(
  _chainId: Hex,
  quotesInput: GenericQuoteRequest,
  data: string,
) {
  const result = decodeCommandDataV3('0', data);

  const { srcTokenAddress, destTokenAddress } = getTokenAddressesFromBytes(
    result[3],
  );
  return {
    amountMin: result[2].toNumber(),
    isExactOut: false,
    quotesInput: {
      ...(quotesInput ?? {}),
      srcTokenAmount: result[1].toString(),
      srcTokenAddress,
      destTokenAddress,
    } as GenericQuoteRequest,
  };
}

function handleSweepCommand(
  _chainId: Hex,
  quotesInput: GenericQuoteRequest,
  data: string,
) {
  const result = decodeCommandDataV3('4', data);

  return {
    amountMin: result[2].toNumber(),
    isExactOut: false,
    quotesInput,
  };
}

const DAPP_SWAP_COMMANDS = [
  { value: '00', handler: handleV3SwapExactInCommand },
  { value: '01', handler: handleCommandSwapExactOut },
  { value: '04', handler: handleSweepCommand },
  { value: '10', handler: handleV4SwapCommand },
  { value: '10_06', handler: handleV4CommandSwapExactInSingle },
  { value: '10_07', handler: handleV4CommandSwapExactIn },
  { value: '10_09', handler: handleCommandSwapExactOut },
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
    const data = getCommandData(commandBytes, inputs, command.value);
    if (data === undefined) {
      return;
    }
    const result = command.handler(chainId, quotesInput, data);
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

  console.log('*********************', quotesInput, amountMin);
  return {
    quotesInput,
    amountMin,
  };
}
