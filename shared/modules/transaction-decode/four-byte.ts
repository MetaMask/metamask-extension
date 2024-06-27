import { addHexPrefix } from 'ethereumjs-util';
import { Interface } from '@ethersproject/abi';
import { DecodedTransactionMethod, FourByteResponse } from './types';

export function decodeTransactionDataWithFourByte(
  response: FourByteResponse,
  transactionData: string,
): DecodedTransactionMethod {
  const { name, params: rawParams } = response;
  const types = rawParams.map((param) => param.type);
  const valueData = addHexPrefix(transactionData.slice(10));
  const values = Interface.getAbiCoder().decode(types, valueData);

  const params = rawParams.map((param, index) => {
    const { type } = param;
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
