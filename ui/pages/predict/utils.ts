import { encode } from '@metamask/abi-utils';
import {
  toFunctionSelector,
  toHex,
  concat,
  type Hex,
} from '../../../shared/lib/delegation/utils';

export const encodeApprove = ({
  spender,
  amount,
}: {
  spender: string;
  amount: bigint | string;
}): Hex => {
  const encodedSignature = toFunctionSelector('approve(address,uint256)');
  const encodedData = toHex(encode(['address', 'uint256'], [spender, amount]));
  return concat([encodedSignature, encodedData]);
};
