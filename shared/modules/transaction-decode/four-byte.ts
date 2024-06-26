import { addHexPrefix } from 'ethereumjs-util';
import { DecodedTransactionMethod, FourByteResponse } from './types';
import { Interface } from '@ethersproject/abi';

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
    const name = `Param #${index + 1}`;
    const description = type;
    const value = values[index];

    return {
      name,
      type,
      description,
      value,
    };
  });

  return {
    name,
    params,
  };
}
