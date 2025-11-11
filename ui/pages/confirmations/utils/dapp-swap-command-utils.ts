import { GenericQuoteRequest } from '@metamask/bridge-controller';
import { Hex } from '@metamask/utils';
import { Interface } from '@ethersproject/abi';

const ROUTER_COMMANDS_V3 = {
  '0': {
    name: 'V3_SWAP_EXACT_IN',
    params: [
      {
        type: 'address',
        description: 'The recipient of the output of the trade',
        name: 'recipient',
      },
      {
        type: 'uint256',
        description: 'The amount of input tokens for the trade',
        name: 'amountIn',
      },
      {
        type: 'uint256',
        description: 'The minimum amount of output tokens the user wants',
        name: 'amountOutMin',
      },
      {
        type: 'bytes',
        description: 'The UniswapV3 encoded path to trade along',
        name: 'path',
      },
      {
        type: 'bool',
        description:
          'A flag for whether the input tokens should come from the msg.sender (through Permit2) or whether the funds are already in the UniversalRouter',
        name: 'payerIsUser',
      },
    ],
  },
};

const POOL_KEY_STRUCT =
  '(address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks)';

const PATH_KEY_STRUCT =
  '(address intermediateCurrency,uint256 fee,int24 tickSpacing,address hooks,bytes hookData)';

const SWAP_EXACT_IN_SINGLE_STRUCT = `(${POOL_KEY_STRUCT} poolKey,bool zeroForOne,uint128 amountIn,uint128 amountOutMinimum,bytes hookData)`;

const SWAP_EXACT_IN_STRUCT = `(address currencyIn,${PATH_KEY_STRUCT} path,uint128 amountIn,uint128 amountOutMinimum)`;

const decodeV4SwapCommandData = (data: string) => {
  const abiDecoder = Interface.getAbiCoder();
  const values = abiDecoder.decode(['bytes', 'bytes[]'], data);
  return values;
};

const decodeCommandDataV4 = (type: string, data: string) => {
  const abiDecoder = Interface.getAbiCoder();
  const values = abiDecoder.decode([type], data);
  return values[0];
};

const decodeCommandDataV3 = (action: string, data: string) => {
  const definition =
    ROUTER_COMMANDS_V3[String(action) as keyof typeof ROUTER_COMMANDS_V3];
  const types = definition.params.map((param) => param.type);
  const abiDecoder = Interface.getAbiCoder();
  return abiDecoder.decode(types, data);
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
  data: string,
  quotesInput: GenericQuoteRequest,
  chainId: Hex,
) {
  const decoded = decodeV4SwapCommandData(data);
  let commandBytes = decoded[0].slice(2).match(/.{1,2}/gu) ?? [];
  commandBytes = commandBytes.map((byte: string) => `10_${byte}`);
  const result = getCommandValues(commandBytes, decoded[1], chainId);

  return {
    amountMin: result.amountMin,
    quotesInput: {
      ...(quotesInput ?? {}),
      ...result.quotesInput,
    } as GenericQuoteRequest,
  };
}

function handleV4CommandSwapExactIn(
  data: string,
  quotesInput: GenericQuoteRequest,
  _chainId: Hex,
) {
  const result = decodeCommandDataV4(SWAP_EXACT_IN_STRUCT, data);

  return {
    amountMin: result.amountOutMinimum.toHexString(),
    quotesInput: {
      ...(quotesInput ?? {}),
      srcTokenAmount: result.amountIn.toHexString(),
      srcTokenAddress: result.currencyIn?.toLowerCase(),
      destTokenAddress: result.path[result.path.length - 1][0]?.toLowerCase(),
    } as GenericQuoteRequest,
  };
}

function handleV4CommandSwapExactInSingle(
  data: string,
  quotesInput: GenericQuoteRequest,
  _chainId: Hex,
) {
  const result = decodeCommandDataV4(SWAP_EXACT_IN_SINGLE_STRUCT, data);

  return {
    amountMin: result.amountOutMinimum.toHexString(),
    quotesInput: {
      ...(quotesInput ?? {}),
      srcTokenAmount: result.amountIn.toHexString(),
      srcTokenAddress: result[0][0]?.toLowerCase(),
      destTokenAddress: result[0][1]?.toLowerCase(),
    } as GenericQuoteRequest,
  };
}

function handleCommandSwapExactOut(
  _1: string,
  _2: GenericQuoteRequest,
  _3: Hex,
) {
  throw new Error('Exact out commands are not supported');
}

const getTokenAddressesFromBytes = (args: string[]) => {
  let bytes = '';
  for (let i = 6; i < args.length; i++) {
    bytes += args[i];
  }
  bytes = bytes.replace(/(00)+$/u, '');
  const slices = bytes.match(/.{1,46}/gu);
  const srcTokenAddress = `0x${slices?.[0].substring(0, 40).toLowerCase()}`;
  const destTokenAddress = `0x${slices?.[slices.length - 1].substring(0, 40).toLowerCase()}`;
  return { srcTokenAddress, destTokenAddress };
};

function handleV3SwapExactInCommand(
  data: string,
  quotesInput: GenericQuoteRequest,
  _chainId: Hex,
) {
  const result = decodeCommandDataV3('0', data);
  const { srcTokenAddress, destTokenAddress } = getTokenAddressesFromBytes(
    result[3],
  );
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

const DAPP_SWAP_COMMANDS = [
  { value: '00', handler: handleV3SwapExactInCommand },
  { value: '01', handler: handleCommandSwapExactOut },
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

  DAPP_SWAP_COMMANDS.forEach((command) => {
    const data = getCommandData(commandBytes, inputs, command.value);
    if (data === undefined) {
      return;
    }
    const result = command.handler(data, quotesInput, chainId) as unknown as {
      amountMin?: number;
      quotesInput?: GenericQuoteRequest;
    };
    if (result) {
      if (result.amountMin !== undefined) {
        amountMin = result.amountMin;
      }
      if (result.quotesInput) {
        quotesInput = result.quotesInput;
      }
    }
  });

  return {
    quotesInput,
    amountMin,
  };
}
