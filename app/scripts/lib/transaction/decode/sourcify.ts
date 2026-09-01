import { FunctionFragment, Interface, ParamType } from '@ethersproject/abi';
import { Hex, createProjectLogger } from '@metamask/utils';
import {
  DecodedTransactionDataMethod,
  DecodedTransactionDataParam,
} from '../../../../../shared/types/transaction-decode';

const log = createProjectLogger('sourcify');

export type SourcifyResponse = {
  abi?: {
    inputs: { name: string; type: string }[];
  }[];
  devdoc?: {
    methods?: {
      [signature: string]: {
        details?: string;
        params?: { [name: string]: string };
      };
    };
  };
  userdoc?: {
    methods?: {
      [signature: string]: {
        notice?: string;
        params?: { [name: string]: string };
      };
    };
  };
};

export async function decodeTransactionDataWithSourcify(
  transactionData: Hex,
  contractAddress: Hex,
  chainId: Hex,
): Promise<DecodedTransactionDataMethod | undefined> {
  const { abi, userdoc, devdoc } = await fetchSourcifyContract(
    contractAddress,
    chainId,
  );

  log('Retrieved Sourcify contract', {
    contractAddress,
    chainId,
    abi,
    userdoc,
    devdoc,
  });

  if (!abi) {
    throw new Error('ABI not found');
  }

  const contractInterface = new Interface(abi);
  const functionSignature = transactionData.slice(0, 10);

  let functionData: FunctionFragment | undefined;

  try {
    functionData = contractInterface.getFunction(functionSignature);
  } catch (e) {
    // Ignore
  }

  if (!functionData) {
    log('Failed to find function in ABI', functionSignature, abi);
    return undefined;
  }

  const { name, inputs } = functionData;
  const signature = buildSignature(name, inputs);
  const userDoc = userdoc?.methods?.[signature];
  const devDoc = devdoc?.methods?.[signature];
  const description = userDoc?.notice ?? devDoc?.details;

  log('Extracted NatSpec', { signature, userDoc, devDoc });

  const values = contractInterface.decodeFunctionData(
    functionSignature,
    transactionData,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any[];

  const params = inputs.map((input, index) =>
    decodeParam(input, index, values, userDoc, devDoc),
  );

  return {
    name,
    description,
    params,
  };
}

function decodeParam(
  input: ParamType,
  index: number,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: any[],
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userDoc: any,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  devDoc: any,
): DecodedTransactionDataParam {
  const { name: paramName, type, components } = input;

  const paramDescription =
    userDoc?.params?.[paramName] ?? devDoc?.params?.[paramName];

  const value = values[index];

  let children = components?.map((child, childIndex) =>
    decodeParam(child, childIndex, value, {}, {}),
  );

  if (type.endsWith('[]')) {
    const childType = type.slice(0, -2);

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children = (value as any[]).map((_arrayItem, arrayIndex) => {
      const childName = `Item ${arrayIndex + 1}`;

      return decodeParam(
        { ...input, name: childName, type: childType } as ParamType,
        arrayIndex,
        value,
        {},
        {},
      );
    });
  }

  return {
    name: paramName,
    description: paramDescription,
    type,
    value,
    children,
  };
}

async function fetchSourcifyContract(
  address: Hex,
  chainId: Hex,
): Promise<SourcifyResponse> {
  const chainIdDecimal = parseInt(chainId, 16);

  const response = await fetch(
    `https://sourcify.dev/server/v2/contract/${chainIdDecimal}/${address}?fields=abi,userdoc,devdoc`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Sourcify contract');
  }

  return response.json();
}

function buildSignature(name: string | undefined, inputs: ParamType[]): string {
  const types = inputs.map((input) =>
    input.components?.length
      ? `${buildSignature(undefined, input.components)}${
          input.type.endsWith('[]') ? '[]' : ''
        }`
      : input.type,
  );

  return `${name ?? ''}(${types.join(',')})`;
}
