/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ErrorType } from '../../errors/utils';
import type { ByteArray, Hex } from '../../types/misc';

type TrimOptions = {
  dir?: 'left' | 'right' | undefined;
};
export type TrimReturnType<value extends ByteArray | Hex> = value extends Hex
  ? Hex
  : ByteArray;

export type TrimErrorType = ErrorType;

export function trim<value extends ByteArray | Hex>(
  hexOrBytes: value,
  { dir = 'left' }: TrimOptions = {},
): TrimReturnType<value> {
  let data: any =
    typeof hexOrBytes === 'string' ? hexOrBytes.replace('0x', '') : hexOrBytes;

  let sliceLength = 0;
  for (let i = 0; i < data.length - 1; i++) {
    if (data[dir === 'left' ? i : data.length - i - 1].toString() === '0') {
      sliceLength += 1;
    } else {
      break;
    }
  }
  data =
    dir === 'left'
      ? data.slice(sliceLength)
      : data.slice(0, data.length - sliceLength);

  if (typeof hexOrBytes === 'string') {
    if (data.length === 1 && dir === 'right') {
      data = `${data}0`;
    }
    return `0x${
      data.length % 2 === 1 ? `0${data}` : data
    }` as TrimReturnType<value>;
  }
  return data as TrimReturnType<value>;
}
