import { FunctionFragment, Interface, ParamType } from '@ethersproject/abi';
import { Hex, createProjectLogger } from '@metamask/utils';
import {
  DecodedTransactionDataMethod,
  DecodedTransactionDataParam,
} from '../../../../../shared/types/transaction-decode';

const log = createProjectLogger('sourcify');

export type SourcifyResponse = {
  files: {
    name: string;
    content: string;
  }[];
};

export type SourcifyMetadata = {
  output: {
    abi: {
      inputs: { name: string; type: string }[];
    }[];
    devdoc?: {
      methods: {
        [signature: string]: {
          details?: string;
          params?: { [name: string]: string };
        };
      };
    };
    userdoc?: {
      methods: {
        [signature: string]: {
          notice?: string;
          params?: { [name: string]: string };
        };
      };
    };
  };
};

export async function decodeTransactionDataWithSourcify(
  transactionData: Hex,
  contractAddress: Hex,
  chainId: Hex,
): Promise<DecodedTransactionDataMethod | undefined> {
  const metadata = await fetchSourcifyMetadata(contractAddress, chainId);

  log('Retrieved Sourcify metadata', {
    contractAddress,
    chainId,
    metadata,
  });

  const { abi } = metadata.output;
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
  const userDoc = metadata.output.userdoc?.methods[signature];
  const devDoc = metadata.output.devdoc?.methods[signature];
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

async function fetchSourcifyMetadata(address: Hex, chainId: Hex) {
  const response = await fetchSourcifyFiles(address, chainId);

  const metadata = response.files?.find((file) =>
    file.name.includes('metadata.json'),
  );

  if (!metadata) {
    throw new Error('Metadata not found');
  }

  return JSON.parse(metadata.content) as SourcifyMetadata;
}

async function fetchSourcifyFiles(
  address: Hex,
  chainId: Hex,
): Promise<SourcifyResponse> {
  const chainIdDecimal = parseInt(chainId, 16);

  const respose = await fetch(
    `https://sourcify.dev/server/files/any/${chainIdDecimal}/${address}`,
  );

  if (!respose.ok) {
    throw new Error('Failed to fetch Sourcify files');
  }

  return respose.json();
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
