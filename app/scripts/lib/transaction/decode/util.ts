import { Hex, createProjectLogger } from '@metamask/utils';
import EthQuery from '@metamask/eth-query';
import {
  DecodedTransactionDataMethod,
  DecodedTransactionDataResponse,
  DecodedTransactionDataSource,
} from '../../../../../shared/types/transaction-decode';
import { decodeUniswapRouterTransactionData } from './uniswap';
import { decodeTransactionDataWithSourcify } from './sourcify';
import { getContractProxyAddress } from './proxy';
import { decodeTransactionDataWithFourByte } from './four-byte';

const log = createProjectLogger('transaction-decode');

export async function decodeTransactionData({
  transactionData,
  contractAddress,
  chainId,
  ethQuery,
}: {
  transactionData: Hex;
  contractAddress: Hex;
  chainId: Hex;
  ethQuery: EthQuery;
}): Promise<DecodedTransactionDataResponse | undefined> {
  log('Decoding transaction data', {
    transactionData,
    contractAddress,
    chainId,
  });

  const uniswapData = decodeUniswapRouterTransactionData(transactionData);

  if (uniswapData) {
    log('Decoded with Uniswap commands', uniswapData);

    return {
      data: normalizeDecodedMethods(uniswapData),
      source: DecodedTransactionDataSource.Uniswap,
    };
  }

  const proxyAddress = await getContractProxyAddress(contractAddress, ethQuery);

  if (proxyAddress) {
    log('Retrieved proxy implementation address', proxyAddress);
  }

  const address = proxyAddress ?? contractAddress;

  const sourcifyData = decodeTransactionDataWithSourcify(
    transactionData,
    address,
    chainId,
  );

  const fourByteData = decodeTransactionDataWithFourByte(transactionData);

  const [sourcifyResult, fourByteResult] = await Promise.allSettled([
    sourcifyData,
    fourByteData,
  ]);

  if (sourcifyResult.status === 'fulfilled' && sourcifyResult.value) {
    log('Decoded data with Sourcify', sourcifyResult.value);

    return {
      data: normalizeDecodedMethods([sourcifyResult.value]),
      source: DecodedTransactionDataSource.Sourcify,
    };
  }

  if (fourByteResult.status === 'fulfilled' && fourByteResult.value) {
    log('Decoded data with 4Byte', fourByteResult.value);

    return {
      data: normalizeDecodedMethods([fourByteResult.value]),
      source: DecodedTransactionDataSource.FourByte,
    };
  }

  return undefined;
}

function normalizeDecodedMethods(
  methods: DecodedTransactionDataMethod[],
): DecodedTransactionDataMethod[] {
  return methods.map((method) => normalizeDecodedMethod(method));
}

function normalizeDecodedMethod(
  method: DecodedTransactionDataMethod,
): DecodedTransactionDataMethod {
  return {
    ...method,
    params: method.params.map((param) => ({
      ...param,
      value: normalizeDecodedParamValue(param.value),
    })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDecodedParamValue(value: any): any {
  const hexValue = value._hex;

  if (hexValue) {
    return parseInt(hexValue, 16);
  }

  return value;
}
