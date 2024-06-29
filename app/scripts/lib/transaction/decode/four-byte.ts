import { addHexPrefix } from 'ethereumjs-util';
import { Interface } from '@ethersproject/abi';
import { Hex } from '@metamask/utils';
import { DecodedTransactionDataMethod } from '../../../../../shared/types/transaction-decode';
import { getMethodFrom4Byte } from '../../../../../shared/lib/four-byte';

export async function decodeTransactionDataWithFourByte(
  transactionData: string,
): Promise<DecodedTransactionDataMethod | undefined> {
  const fourBytePrefix = transactionData.slice(0, 10);

  const signature = (await getMethodFrom4Byte(fourBytePrefix)) as Hex;

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
