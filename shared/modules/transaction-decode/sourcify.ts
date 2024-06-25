import { FunctionFragment, Interface } from '@ethersproject/abi';
import { Hex } from '@metamask/utils';
import { DecodedTransactionMethod } from './types';

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
): Promise<DecodedTransactionMethod | undefined> {
  const metadata = await fetchSourcifyMetadata(contractAddress, chainId);
  const abi = metadata.output.abi;
  const contractInterface = new Interface(abi);
  const functionSignature = transactionData.slice(0, 10);

  let functionData: FunctionFragment | undefined;

  try {
    functionData = contractInterface.getFunction(functionSignature);
  } catch (e) {}

  if (!functionData) {
    return undefined;
  }

  const name = functionData.name;
  const types = functionData.inputs.map((input) => input.type);
  const signature = `${name}(${types.join(',')})`;
  const userDoc = metadata.output.userdoc?.methods[signature];
  const devDoc = metadata.output.devdoc?.methods[signature];
  const description = userDoc?.notice ?? devDoc?.details;

  const values = contractInterface.decodeFunctionData(
    functionSignature,
    transactionData,
  );

  const params = functionData.inputs.map((input, index) => {
    const { name, type } = input;
    const comment = userDoc?.params?.[name] ?? devDoc?.params?.[name];
    const description = `${type}${comment ? ` - ${comment}` : ''}`;
    const value = values[index];

    return {
      name,
      description,
      type,
      value,
    };
  });

  return {
    name,
    description,
    params,
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
