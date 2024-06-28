import { addHexPrefix } from 'ethereumjs-util';
import { Interface } from '@ethersproject/abi';
import { Hex } from '@metamask/utils';
import { DecodedTransactionDataMethod } from '../../../../../shared/types/transaction-decode';
import fetchWithCache from '../../../../../shared/lib/fetch-with-cache';

export async function decodeTransactionDataWithFourByte(
  transactionData: string,
): Promise<DecodedTransactionDataMethod | undefined> {
  const fourBytePrefix = transactionData.slice(0, 10);

  const signature = (await getFourByteResponse(fourBytePrefix)) as Hex;

  if (!signature) {
    return undefined;
  }

  const name = signature.split('(')[0];
  const types = signature.split('(')[1].split(')')[0].split(',');
  const valueData = addHexPrefix(transactionData.slice(10));
  const values = Interface.getAbiCoder().decode(types, valueData);

  const params = types.map((type, index) => {
    const value = values[index];

    return {
      type,
      value,
    };
  });

  return {
    name,
    params,
  };
}

async function getFourByteResponse(fourBytePrefix: string) {
  const fourByteResponse = await fetchWithCache({
    url: `https://www.4byte.directory/api/v1/signatures/?hex_signature=${fourBytePrefix}`,
    fetchOptions: {
      referrerPolicy: 'no-referrer-when-downgrade',
      body: null,
      method: 'GET',
      mode: 'cors',
    },
    functionName: 'getMethodFrom4Byte',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fourByteResponse.results.sort((a: any, b: any) => {
    return new Date(a.created_at).getTime() < new Date(b.created_at).getTime()
      ? -1
      : 1;
  });

  return fourByteResponse.results[0].text_signature;
}
