import { Interface, TransactionDescription } from '@ethersproject/abi';
import { Hex } from '@metamask/utils';
import { addHexPrefix, stripHexPrefix } from 'ethereumjs-util';
import { UNISWAP_ROUTER_COMMANDS } from './uniswap-commands';

export type UniswapRouterCommand = {
  name: string;
  params: {
    name: string;
    type: string;
    description: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
  }[];
};

export type UniswapPathPool = {
  firstAddress: Hex;
  tickSpacing: number;
  secondAddress: Hex;
};

const ADDRESS_LENGTH = 40;
const TICK_SPACING_LENGTH = 6;

const ABI = [
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

export function decodeUniswapRouterTransactionData(
  transactionData: Hex,
): UniswapRouterCommand[] | undefined {
  const contractInterface = new Interface(ABI);

  let parsedTransactionData: TransactionDescription;

  try {
    parsedTransactionData = contractInterface.parseTransaction({
      data: transactionData,
    });
  } catch (error) {
    return undefined;
  }

  const commands = parsedTransactionData.args.commands as string;
  const inputs = parsedTransactionData.args.inputs as string[];
  const commandBytes = commands.slice(2).match(/.{1,2}/gu) as string[];

  return commandBytes
    .map((commandByte, i) => decodeUniswapCommand(commandByte, inputs[i]))
    .filter((command) => command !== undefined) as UniswapRouterCommand[];
}

function decodeUniswapCommand(
  commandByte: string,
  input: string,
): UniswapRouterCommand | undefined {
  const commandValue = parseInt(commandByte, 16);
  // eslint-disable-next-line no-bitwise
  const commandIndex = commandValue & 0b11111;

  const data =
    UNISWAP_ROUTER_COMMANDS[
      String(commandIndex) as keyof typeof UNISWAP_ROUTER_COMMANDS
    ];

  if (!data) {
    return undefined;
  }

  const types = data.params.map((param) => param.type);
  const abiDecoder = Interface.getAbiCoder();
  const values = abiDecoder.decode(types, input);
  const { name } = data;

  const params = data.params.map((param, index) => {
    const { name: paramName, type, description } = param;
    const rawData = values[index];
    const value = paramName === 'path' ? decodeUniswapPath(rawData) : rawData;

    return { name: paramName, type, value, description };
  });

  return {
    name,
    params,
  };
}

function decodeUniswapPath(rawPath: string): UniswapPathPool[] {
  const pools: UniswapPathPool[] = [];
  let remainingData = stripHexPrefix(rawPath);
  let currentPool = {} as UniswapPathPool;
  let isParsingAddress = true;

  while (remainingData.length) {
    if (isParsingAddress) {
      const address = addHexPrefix(
        remainingData.slice(0, ADDRESS_LENGTH),
      ) as Hex;

      if (currentPool.firstAddress) {
        currentPool.secondAddress = address;

        pools.push(currentPool);

        currentPool = {
          firstAddress: address,
        } as UniswapPathPool;
      } else {
        currentPool.firstAddress = address;
      }

      remainingData = remainingData.slice(ADDRESS_LENGTH);
    } else {
      currentPool.tickSpacing = parseInt(
        remainingData.slice(0, TICK_SPACING_LENGTH),
        16,
      );

      remainingData = remainingData.slice(TICK_SPACING_LENGTH);
    }

    isParsingAddress = !isParsingAddress;
  }

  return pools;
}
