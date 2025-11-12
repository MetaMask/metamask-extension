/* eslint-disable @typescript-eslint/naming-convention */
import { GenericQuoteRequest } from '@metamask/bridge-controller';
import { Hex } from '@metamask/utils';
import { Interface, Result } from '@ethersproject/abi';
// eslint-disable-next-line import/no-restricted-paths
import { decodeUniswapPath } from '../../../../app/scripts/lib/transaction/decode/uniswap';

export enum Commands {
  V3_SWAP_EXACT_IN = '00',
  V3_SWAP_EXACT_OUT = '01',
  V2_SWAP_EXACT_IN = '08',
  V2_SWAP_EXACT_OUT = '09',
  V4_SWAP = '10',
}

const BASE_COMMANDS_ABI_DEFINITION: Partial<
  Record<Commands, { name: string; type: string }[]>
> = {
  // Swapping commands
  [Commands.V3_SWAP_EXACT_IN]: [
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
};

export enum V4Actions {
  // swapping
  SWAP_EXACT_IN_SINGLE = '06',
  SWAP_EXACT_IN = '07',
  SWAP_EXACT_OUT_SINGLE = '08',
  SWAP_EXACT_OUT = '09',
}

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
  amountMin?: number | undefined;
  isExactOut?: boolean | undefined;
  quotesInput?: GenericQuoteRequest | undefined;
};

type DAPP_SWAP_COMMANDS_PARSER_TYPE = {
  value: string;
  handler: (
    data: string,
    quotesInput: GenericQuoteRequest,
    _chainId: Hex,
  ) => {
    amountMin: number | undefined;
    isExactOut?: boolean | undefined;
    quotesInput: GenericQuoteRequest;
  };
};

const DAPP_SWAP_COMMANDS_PARSER: DAPP_SWAP_COMMANDS_PARSER_TYPE[] = [
  { value: '00', handler: handleV3SwapExactInCommand },
  { value: '10', handler: handleV4SwapCommand },
];

const V4_SWAP_ACTIONS_PARSER: DAPP_SWAP_COMMANDS_PARSER_TYPE[] = [
  { value: '06', handler: handleV4CommandSwapExactInSingle },
  { value: '07', handler: handleV4CommandSwapExactIn },
];

const decodeV4SwapCommandData = (data: string) => {
  const abiDecoder = Interface.getAbiCoder();
  const values = abiDecoder.decode(['bytes', 'bytes[]'], data);
  return values;
};

function decodeCommandData(
  action: Commands,
  data: string,
  ABI_DEFINITION: typeof BASE_COMMANDS_ABI_DEFINITION,
): Result;
function decodeCommandData(
  action: V4Actions,
  data: string,
  ABI_DEFINITION: typeof V4_BASE_ACTIONS_ABI_DEFINITION,
): Result;
function decodeCommandData(
  action: Commands | V4Actions,
  data: string,
  ABI_DEFINITION: Record<string, { name: string; type: string }[]>,
): Result {
  if (!ABI_DEFINITION[action]) {
    throw new Error(`Action ${action} not found in ABI definition`);
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

function handleV4SwapCommand(
  data: string,
  quotesInput: GenericQuoteRequest,
  chainId: Hex,
) {
  const decoded = decodeV4SwapCommandData(data);
  const actionBytes = decoded[0].slice(2).match(/.{1,2}/gu) ?? [];
  const actionParameters = decoded[1];
  const result = getV4SwapActionValues(actionBytes, actionParameters, chainId);

  return {
    amountMin: result.amountMin,
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
  quotesInput: GenericQuoteRequest,
  _chainId: Hex,
) {
  const result = decodeCommandData(
    V4Actions.SWAP_EXACT_IN,
    data,
    V4_BASE_ACTIONS_ABI_DEFINITION,
  );
  const parsedResult = parseV4ExactIn(result[0]);
  return {
    amountMin: parsedResult.amountOutMinimum.toNumber(),
    isExactOut: false,
    quotesInput: {
      ...(quotesInput ?? {}),
      srcTokenAmount: parsedResult.amountIn,
      srcTokenAddress: parsedResult.currencyIn,
      destTokenAddress:
        parsedResult.path[parsedResult.path.length - 1].intermediateCurrency,
    } as GenericQuoteRequest,
  };
}

function handleV4CommandSwapExactInSingle(
  data: string,
  quotesInput: GenericQuoteRequest,
  _chainId: Hex,
) {
  const result = decodeCommandData(
    V4Actions.SWAP_EXACT_IN_SINGLE,
    data,
    V4_BASE_ACTIONS_ABI_DEFINITION,
  );
  const parsedResult = parseV4ExactInSingle(result[0]);

  return {
    amountMin: parsedResult.amountOutMinimum.toNumber(),
    isExactOut: false,
    quotesInput: {
      ...(quotesInput ?? {}),
      srcTokenAmount: parsedResult.amountIn,
      srcTokenAddress: parsedResult.zeroForOne
        ? parsedResult.poolKey.currency0
        : parsedResult.poolKey.currency1,
      destTokenAddress: parsedResult.zeroForOne
        ? parsedResult.poolKey.currency1
        : parsedResult.poolKey.currency0,
    } as GenericQuoteRequest,
  };
}

function handleV3SwapExactInCommand(
  data: string,
  quotesInput: GenericQuoteRequest,
  _chainId: Hex,
) {
  const result = decodeCommandData(
    Commands.V3_SWAP_EXACT_IN,
    data,
    BASE_COMMANDS_ABI_DEFINITION,
  );

  const decodedPath = decodeUniswapPath(result[3]);
  const srcTokenAddress = decodedPath[0].firstAddress;
  const destTokenAddress = decodedPath[decodedPath.length - 1].secondAddress;

  return {
    amountMin: result[2].toHexString(),
    quotesInput: {
      ...(quotesInput ?? {}),
      srcTokenAmount: result[1].toHexString(),
      srcTokenAddress,
      destTokenAddress,
    } as GenericQuoteRequest,
  };
}

function getGenericValues(
  commandBytes: string[],
  inputs: string[],
  chainId: Hex,
  parserDefinition: DAPP_SWAP_COMMANDS_PARSER_TYPE[],
  CommandsDefinition: typeof Commands | typeof V4Actions,
): COMMAND_VALUES_RESULT {
  if (commandBytes.length === 0) {
    return {
      amountMin: undefined,
      quotesInput: undefined,
    };
  }

  const swapCommands = commandBytes.filter((commandByte) =>
    Object.values(CommandsDefinition).includes(commandByte),
  );

  if (swapCommands.length !== 1) {
    throw new Error(`Found swap commands ${swapCommands.length} instead of 1`);
  }

  let amountMin;
  let quotesInput = {
    srcChainId: chainId,
    destChainId: chainId,
    gasIncluded: false,
    gasIncluded7702: false,
  } as GenericQuoteRequest;

  const isExactOutRequest = false;

  const data = getCommandData(commandBytes, inputs, swapCommands[0]);

  if (data !== undefined) {
    const commandParser: DAPP_SWAP_COMMANDS_PARSER_TYPE | undefined =
      parserDefinition.find(
        (parser: DAPP_SWAP_COMMANDS_PARSER_TYPE) =>
          parser.value === swapCommands[0],
      );

    const result = commandParser?.handler(data, quotesInput, chainId);
    if (result) {
      if (result.amountMin !== undefined) {
        amountMin = result.amountMin;
      }
      if (result.quotesInput) {
        quotesInput = result.quotesInput;
      }
    }
  }

  if (isExactOutRequest) {
    return { isExactOut: true };
  }

  return {
    quotesInput,
    amountMin,
  };
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
    V4Actions,
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
    Commands,
  );
}
