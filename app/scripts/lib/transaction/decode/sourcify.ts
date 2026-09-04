import { FunctionFragment, Interface, ParamType } from '@ethersproject/abi';
import { Hex, createProjectLogger } from '@metamask/utils';
import {
  DecodedTransactionDataMethod,
  DecodedTransactionDataParam,
} from '../../../../../shared/types/transaction-decode';

const log = createProjectLogger('sourcify');

const ABI_FIELDS = 'abi,userdoc,devdoc';
const PROXY_FIELDS = 'proxyResolution';

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
  proxyResolution?: {
    isProxy: boolean;
    implementations: { address: string; name?: string }[];
  };
};

export async function decodeTransactionDataWithSourcify(
  transactionData: Hex,
  contractAddress: Hex,
  chainId: Hex,
): Promise<DecodedTransactionDataMethod | undefined> {
  const contract = await fetchSourcifyContract(
    contractAddress,
    chainId,
    ABI_FIELDS,
  );

  log('Retrieved Sourcify contract', {
    contractAddress,
    chainId,
    ...contract,
  });

  if (!contract.abi) {
    throw new Error('ABI not found');
  }

  const decoded = decodeWithContract(transactionData, contract);

  if (decoded) {
    return decoded;
  }

  // A proxy's own ABI does not describe the calls it forwards, and
  // getContractProxyAddress only reads the two standard implementation slots.
  // Sourcify resolves the proxies that keep the pointer somewhere else. Ask it
  // only once the address's own ABI has failed to explain the call, so
  // contracts that are not proxies, which is nearly all of them, cost no extra
  // request.
  const implementation = await fetchProxyImplementation(
    contractAddress,
    chainId,
  );

  if (!implementation) {
    return undefined;
  }

  log('Retrying with Sourcify proxy implementation', implementation);

  return decodeWithContract(
    transactionData,
    await fetchSourcifyContract(implementation, chainId, ABI_FIELDS),
  );
}

function decodeWithContract(
  transactionData: Hex,
  { abi, userdoc, devdoc }: SourcifyResponse,
): DecodedTransactionDataMethod | undefined {
  if (!abi) {
    log('No ABI in Sourcify response');
    return undefined;
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

async function fetchProxyImplementation(
  address: Hex,
  chainId: Hex,
): Promise<Hex | undefined> {
  const { proxyResolution } = await fetchSourcifyContract(
    address,
    chainId,
    PROXY_FIELDS,
  );

  if (!proxyResolution?.isProxy) {
    return undefined;
  }

  return proxyResolution.implementations[0]?.address as Hex | undefined;
}

async function fetchSourcifyContract(
  address: Hex,
  chainId: Hex,
  fields: string,
): Promise<SourcifyResponse> {
  const chainIdDecimal = parseInt(chainId, 16);

  const response = await fetch(
    `https://sourcify.dev/server/v2/contract/${chainIdDecimal}/${address}?fields=${fields}`,
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
