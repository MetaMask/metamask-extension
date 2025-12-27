/* eslint-disable @typescript-eslint/naming-convention */
import { GenericQuoteRequest } from '@metamask/bridge-controller';
import { Hex } from '@metamask/utils';
import { Interface, Result } from '@ethersproject/abi';
import { getNativeTokenAddress } from '@metamask/assets-controllers';

import { decodeCommandV3Path } from '../decoding';

export class DappSwapDecodingError extends Error {}

enum SwapCommands {
  V3_SWAP_EXACT_IN = '00',
  V3_SWAP_EXACT_OUT = '01',
  V2_SWAP_EXACT_IN = '08',
  V2_SWAP_EXACT_OUT = '09',
  V4_SWAP = '10',
}

enum NonSwapCommands {
  SWEEP = '04',
  WRAP_ETH = '0b',
  UNWRAP_WETH = '0c',
}

type Commands = SwapCommands | NonSwapCommands;

enum V4Actions {
  SWAP_EXACT_IN_SINGLE = '06',
  SWAP_EXACT_IN = '07',
  SWAP_EXACT_OUT_SINGLE = '08',
  SWAP_EXACT_OUT = '09',
}

const BASE_COMMANDS_ABI_DEFINITION: Partial<
  Record<Commands, { name: string; type: string }[]>
> = {
  [SwapCommands.V3_SWAP_EXACT_IN]: [
    {
      type: 'address',
      name: 'recipient',
    },
    {
      type: 'uint256',
      name: 'amountIn',
    },
    {
      type: 'uint256',
      name: 'amountOutMin',
    },
    {
      type: 'bytes',
      name: 'path',
    },
    {
      type: 'bool',
      name: 'payerIsUser',
    },
  ],
  [SwapCommands.V2_SWAP_EXACT_IN]: [
    {
      type: 'address',
      name: 'recipient',
    },
    {
      type: 'uint256',
      name: 'amountIn',
    },
    {
      type: 'uint256',
      name: 'amountOutMin',
    },
    {
      type: 'address[]',
      name: 'path',
    },
    {
      type: 'bool',
      name: 'payerIsUser',
    },
  ],
  [NonSwapCommands.SWEEP]: [
    {
      type: 'address',
      name: 'token',
    },
    {
      type: 'address',
      name: 'recipient',
    },
    {
      type: 'uint256',
      name: 'amountMin',
    },
  ],
  [NonSwapCommands.WRAP_ETH]: [
    {
      type: 'address',
      name: 'recipient',
    },
    {
      type: 'uint256',
      name: 'amountMin',
    },
  ],
  [NonSwapCommands.UNWRAP_WETH]: [
    {
      type: 'address',
      name: 'recipient',
    },
    {
      type: 'uint256',
      name: 'amountMin',
    },
  ],
};

const POOL_KEY_STRUCT =
  '(address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks)';

const PATH_KEY_STRUCT =
  '(address intermediateCurrency,uint256 fee,int24 tickSpacing,address hooks,bytes hookData)';

const SWAP_EXACT_IN_SINGLE_STRUCT = `(${
  POOL_KEY_STRUCT
} poolKey,bool zeroForOne,uint128 amountIn,uint128 amountOutMinimum,bytes hookData)`;

const SWAP_EXACT_IN_STRUCT = `(address currencyIn,${
  PATH_KEY_STRUCT
}[] path,uint128 amountIn,uint128 amountOutMinimum)`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const V4_BASE_ACTIONS_ABI_DEFINITION: Partial<
  Record<V4Actions, { name: string; type: string }[]>
> = {
  // Swapping commands
  [V4Actions.SWAP_EXACT_IN_SINGLE]: [
    {
      name: 'swap',
      type: SWAP_EXACT_IN_SINGLE_STRUCT,
    },
  ],
  [V4Actions.SWAP_EXACT_IN]: [
    {
      name: 'swap',
      type: SWAP_EXACT_IN_STRUCT,
    },
  ],
};

type PathKey = {
  intermediateCurrency: string; // address
  fee: number;
  tickSpacing: number;
  hooks: string; // address
  hookData: string; // bytes
};

type COMMAND_VALUES_RESULT = {
  amountMin?: string | undefined;
  quotesInput?: GenericQuoteRequest | undefined;
};

type DAPP_SWAP_COMMANDS_PARSER_TYPE = {
  value: string;
  handler: (
    data: string,
    decodedResult: COMMAND_VALUES_RESULT,
    _chainId: Hex,
  ) => {
    amountMin: string | undefined;
    quotesInput: GenericQuoteRequest;
  };
};

const DAPP_SWAP_COMMANDS_PARSER: DAPP_SWAP_COMMANDS_PARSER_TYPE[] = [
  { value: '00', handler: handleV3CommandSwapExactIn },
  { value: '08', handler: handleV2CommandSwapExactIn },
  {
    value: '01',
    handler: handleCommandExactOut as DAPP_SWAP_COMMANDS_PARSER_TYPE['handler'],
  },
  {
    value: '09',
    handler: handleCommandExactOut as DAPP_SWAP_COMMANDS_PARSER_TYPE['handler'],
  },
  { value: '10', handler: handleV4CommandSwap },
  { value: '04', handler: handleCommandSweep },
  { value: '0b', handler: handleCommandWrapETH },
  { value: '0c', handler: handleCommandUnwrapETH },
];

const V4_SWAP_ACTIONS_PARSER: DAPP_SWAP_COMMANDS_PARSER_TYPE[] = [
  { value: '06', handler: handleV4CommandSwapExactInSingle },
  { value: '07', handler: handleV4CommandSwapExactIn },
  {
    value: '08',
    handler: handleCommandExactOut as DAPP_SWAP_COMMANDS_PARSER_TYPE['handler'],
  },
  {
    value: '09',
    handler: handleCommandExactOut as DAPP_SWAP_COMMANDS_PARSER_TYPE['handler'],
  },
];

const decodeV4SwapCommandData = (data: string) => {
  const abiDecoder = Interface.getAbiCoder();
  const values = abiDecoder.decode(['bytes', 'bytes[]'], data);
  return values;
};

function decodeCommandData(
  action: Commands | V4Actions,
  data: string,
  ABI_DEFINITION: Record<string, { name: string; type: string }[]>,
): Result {
  if (!ABI_DEFINITION[action]) {
    throw new DappSwapDecodingError(
      `Action ${action} not found in ABI definition`,
    );
  }

  const abiDecoder = Interface.getAbiCoder();
  const values = abiDecoder.decode(
    ABI_DEFINITION[action].map((v) => v.type),
    data,
  );

  return values;
}

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

function handleV4CommandSwap(
  data: string,
  decodedResult: COMMAND_VALUES_RESULT,
  chainId: Hex,
) {
  const { amountMin, quotesInput } = decodedResult;
  const decoded = decodeV4SwapCommandData(data);
  const actionBytes = decoded[0].slice(2).match(/.{1,2}/gu) ?? [];
  const actionParameters = decoded[1];
  const result = getV4SwapActionValues(actionBytes, actionParameters, chainId);

  return {
    amountMin: amountMin || result.amountMin,
    quotesInput: {
      ...(quotesInput ?? {}),
      ...result.quotesInput,
    } as GenericQuoteRequest,
  };
}

function parseV4ExactInSingle(data: Result) {
  const [poolKey, zeroForOne, amountIn, amountOutMinimum, hookData] = data;
  const [currency0, currency1, fee, tickSpacing, hooks] = poolKey;
  return {
    poolKey: {
      currency0,
      currency1,
      fee,
      tickSpacing,
      hooks,
    },
    zeroForOne,
    amountIn,
    amountOutMinimum,
    hookData,
  };
}

function parsePathKey(data: string) {
  const [intermediateCurrency, fee, tickSpacing, hooks, hookData] = data;

  /* eslint-disable radix */
  return {
    intermediateCurrency,
    fee: parseInt(fee),
    tickSpacing: parseInt(tickSpacing),
    hooks,
    hookData,
  };
  /* eslint-enable radix */
}

function parseV4ExactIn(data: Result) {
  const [currencyIn, path, amountIn, amountOutMinimum] = data;
  const paths: readonly PathKey[] = path.map((pathKey: string) =>
    parsePathKey(pathKey),
  );

  return {
    path: paths,
    currencyIn,
    amountIn,
    amountOutMinimum,
  };
}

function handleV4CommandSwapExactIn(
  data: string,
  decodedResult: COMMAND_VALUES_RESULT,
  _chainId: Hex,
) {
  const { amountMin, quotesInput } = decodedResult;
  const result = decodeCommandData(
    V4Actions.SWAP_EXACT_IN,
    data,
    V4_BASE_ACTIONS_ABI_DEFINITION,
  );
  const parsedResult = parseV4ExactIn(result[0]);
  return {
    amountMin: amountMin || parsedResult.amountOutMinimum.toHexString(),
    quotesInput: {
      ...(quotesInput ?? {}),
      srcTokenAmount: parsedResult.amountIn.toHexString(),
      srcTokenAddress:
        quotesInput?.srcTokenAddress ?? parsedResult.currencyIn.toLowerCase(),
      destTokenAddress:
        quotesInput?.destTokenAddress ??
        parsedResult.path[
          parsedResult.path.length - 1
        ].intermediateCurrency.toLowerCase(),
    } as GenericQuoteRequest,
  };
}

function handleV4CommandSwapExactInSingle(
  data: string,
  decodedResult: COMMAND_VALUES_RESULT,
  _chainId: Hex,
) {
  const { amountMin, quotesInput } = decodedResult;
  const result = decodeCommandData(
    V4Actions.SWAP_EXACT_IN_SINGLE,
    data,
    V4_BASE_ACTIONS_ABI_DEFINITION,
  );
  const parsedResult = parseV4ExactInSingle(result[0]);

  return {
    amountMin: amountMin || parsedResult.amountOutMinimum.toHexString(),
    quotesInput: {
      ...(quotesInput ?? {}),
      srcTokenAmount: parsedResult.amountIn.toHexString(),
      srcTokenAddress:
        quotesInput?.srcTokenAddress ??
        (parsedResult.zeroForOne
          ? parsedResult.poolKey.currency0.toLowerCase()
          : parsedResult.poolKey.currency1.toLowerCase()),
      destTokenAddress:
        quotesInput?.destTokenAddress ??
        (parsedResult.zeroForOne
          ? parsedResult.poolKey.currency1.toLowerCase()
          : parsedResult.poolKey.currency0.toLowerCase()),
    } as GenericQuoteRequest,
  };
}

function handleV3CommandSwapExactIn(
  data: string,
  decodedResult: COMMAND_VALUES_RESULT,
  _chainId: Hex,
) {
  const { amountMin, quotesInput } = decodedResult;
  const result = decodeCommandData(
    SwapCommands.V3_SWAP_EXACT_IN,
    data,
    BASE_COMMANDS_ABI_DEFINITION,
  );

  const decodedPath = decodeCommandV3Path(result[3]);
  const srcTokenAddress =
    quotesInput?.srcTokenAddress ?? decodedPath[0].firstAddress.toLowerCase();
  const destTokenAddress =
    quotesInput?.destTokenAddress ??
    decodedPath[decodedPath.length - 1].secondAddress.toLowerCase();

  return {
    amountMin: amountMin || result[2].toHexString(),
    quotesInput: {
      ...(quotesInput ?? {}),
      srcTokenAmount: result[1].toHexString(),
      srcTokenAddress,
      destTokenAddress,
    } as GenericQuoteRequest,
  };
}

function handleV2CommandSwapExactIn(
  data: string,
  decodedResult: COMMAND_VALUES_RESULT,
  _chainId: Hex,
) {
  const { amountMin, quotesInput } = decodedResult;
  const result = decodeCommandData(
    SwapCommands.V2_SWAP_EXACT_IN,
    data,
    BASE_COMMANDS_ABI_DEFINITION,
  );

  return {
    amountMin: amountMin || result[2].toHexString(),
    quotesInput: {
      ...(quotesInput ?? {}),
      srcTokenAmount: result[1].toHexString(),
      srcTokenAddress:
        quotesInput?.srcTokenAddress ?? result[3]?.[0]?.toLowerCase(),
      destTokenAddress:
        quotesInput?.destTokenAddress ??
        result[3]?.[result[3]?.length - 1]?.toLowerCase(),
    } as GenericQuoteRequest,
  };
}

function handleCommandSweep(
  data: string,
  decodedResult: COMMAND_VALUES_RESULT,
  _chainId: Hex,
) {
  const { quotesInput } = decodedResult;
  const result = decodeCommandData(
    NonSwapCommands.SWEEP,
    data,
    BASE_COMMANDS_ABI_DEFINITION,
  );

  return {
    amountMin: result[2].toHexString(),
    quotesInput: quotesInput as GenericQuoteRequest,
  };
}

function handleCommandWrapETH(
  _data: string,
  decodedResult: COMMAND_VALUES_RESULT,
  chainId: Hex,
) {
  const { amountMin, quotesInput } = decodedResult;
  return {
    amountMin,
    quotesInput: {
      ...(quotesInput ?? {}),
      srcTokenAddress: getNativeTokenAddress(chainId),
    } as GenericQuoteRequest,
  };
}

function handleCommandUnwrapETH(
  data: string,
  decodedResult: COMMAND_VALUES_RESULT,
  chainId: Hex,
) {
  const { quotesInput } = decodedResult;
  const result = decodeCommandData(
    NonSwapCommands.UNWRAP_WETH,
    data,
    BASE_COMMANDS_ABI_DEFINITION,
  );

  return {
    amountMin: result[1].toHexString(),
    quotesInput: {
      ...(quotesInput ?? {}),
      destTokenAddress: getNativeTokenAddress(chainId),
    } as GenericQuoteRequest,
  };
}

function handleCommandExactOut(_1: string, _2: COMMAND_VALUES_RESULT, _3: Hex) {
  throw new DappSwapDecodingError('Exact-out commands are not supported yet');
}

function getGenericValues(
  commandBytes: string[],
  inputs: string[],
  chainId: Hex,
  parserDefinition: DAPP_SWAP_COMMANDS_PARSER_TYPE[],
  commandsDefinition: {
    swapCommandsDefinition: typeof SwapCommands | typeof V4Actions;
    nonSwapCommandsDefinition?: typeof NonSwapCommands;
  },
): COMMAND_VALUES_RESULT {
  if (commandBytes.length === 0) {
    return {
      amountMin: undefined,
      quotesInput: undefined,
    };
  }

  const { swapCommandsDefinition, nonSwapCommandsDefinition } =
    commandsDefinition;

  const swapCommands = commandBytes.filter((commandByte) =>
    Object.values(swapCommandsDefinition).includes(commandByte),
  );

  if (swapCommands.length !== 1) {
    throw new DappSwapDecodingError(
      `Found swap commands ${swapCommands.length} instead of 1`,
    );
  }

  let nonSwapCommands: string[] = [];
  if (nonSwapCommandsDefinition) {
    nonSwapCommands = commandBytes.filter((commandByte) =>
      Object.values(nonSwapCommandsDefinition).includes(
        commandByte as NonSwapCommands,
      ),
    );
  }

  const commands = [...swapCommands, ...nonSwapCommands];

  let decodingResult: COMMAND_VALUES_RESULT = {
    amountMin: undefined,
    quotesInput: {
      srcChainId: chainId,
      destChainId: chainId,
      gasIncluded: false,
      gasIncluded7702: false,
    } as GenericQuoteRequest,
  };

  commands.forEach((command) => {
    const data = getCommandData(commandBytes, inputs, command);

    if (data !== undefined) {
      const commandParser: DAPP_SWAP_COMMANDS_PARSER_TYPE | undefined =
        parserDefinition.find(
          (parser: DAPP_SWAP_COMMANDS_PARSER_TYPE) => parser.value === command,
        );
      const result = commandParser?.handler(data, decodingResult, chainId);
      if (result) {
        decodingResult = result;
      }
    }
  });

  return decodingResult;
}

function getV4SwapActionValues(
  actionBytes: string[],
  actionParameters: string[],
  chainId: Hex,
) {
  return getGenericValues(
    actionBytes,
    actionParameters,
    chainId,
    V4_SWAP_ACTIONS_PARSER,
    {
      swapCommandsDefinition: V4Actions,
    },
  );
}

export function getCommandValues(
  commandBytes: string[],
  inputs: string[],
  chainId: Hex,
) {
  return getGenericValues(
    commandBytes,
    inputs,
    chainId,
    DAPP_SWAP_COMMANDS_PARSER,
    {
      swapCommandsDefinition: SwapCommands,
      nonSwapCommandsDefinition: NonSwapCommands,
    },
  );
}
