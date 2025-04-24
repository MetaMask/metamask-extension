/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable radix */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  AbiParameterToPrimitiveType,
  AbiType,
  Address,
  SolidityAddress,
  SolidityArrayWithoutTuple,
  SolidityBool,
  SolidityBytes,
  SolidityInt,
  SolidityString,
} from 'abitype';

import {
  AbiEncodingLengthMismatchError,
  type AbiEncodingLengthMismatchErrorType,
  BytesSizeMismatchError,
  type BytesSizeMismatchErrorType,
  UnsupportedPackedAbiType,
} from '../../errors/abi';
import {
  InvalidAddressError,
  type InvalidAddressErrorType,
} from '../../errors/address';
import type { ErrorType } from '../../errors/utils';
import type { Hex } from '../../types/misc';
import { type IsAddressErrorType, isAddress } from '../address/isAddress';
import { type ConcatHexErrorType, concatHex } from '../data/concat';
import { type PadErrorType, pad } from '../data/pad';
import {
  type BoolToHexErrorType,
  type NumberToHexErrorType,
  type StringToHexErrorType,
  boolToHex,
  numberToHex,
  stringToHex,
} from '../encoding/toHex';
import { arrayRegex, bytesRegex, integerRegex } from '../regex';

type PackedAbiType =
  | SolidityAddress
  | SolidityBool
  | SolidityBytes
  | SolidityInt
  | SolidityString
  | SolidityArrayWithoutTuple;

type EncodePackedValues<
  packedAbiTypes extends readonly PackedAbiType[] | readonly unknown[],
> = {
  [K in keyof packedAbiTypes]: packedAbiTypes[K] extends AbiType
    ? AbiParameterToPrimitiveType<{ type: packedAbiTypes[K] }>
    : unknown;
};

export type EncodePackedErrorType =
  | AbiEncodingLengthMismatchErrorType
  | ConcatHexErrorType
  | EncodeErrorType
  | ErrorType;

export function encodePacked<
  const packedAbiTypes extends readonly PackedAbiType[] | readonly unknown[],
>(types: packedAbiTypes, values: EncodePackedValues<packedAbiTypes>): Hex {
  if (types.length !== values.length) {
    throw new AbiEncodingLengthMismatchError({
      expectedLength: types.length as number,
      givenLength: values.length as number,
    });
  }

  const data: Hex[] = [];
  for (let i = 0; i < (types as unknown[]).length; i++) {
    const type = types[i];
    const value = values[i];
    data.push(encode(type, value));
  }
  return concatHex(data);
}

type EncodeErrorType =
  | BoolToHexErrorType
  | BytesSizeMismatchErrorType
  | InvalidAddressErrorType
  | IsAddressErrorType
  | NumberToHexErrorType
  | PadErrorType
  | StringToHexErrorType
  | UnsupportedPackedAbiType
  | ErrorType;

function encode<const packedAbiType extends PackedAbiType | unknown>(
  type: packedAbiType,
  value: EncodePackedValues<[packedAbiType]>[0],
  isArray = false,
): Hex {
  if (type === 'address') {
    const address = value as Address;
    if (!isAddress(address)) {
      throw new InvalidAddressError({ address });
    }
    return pad(address.toLowerCase() as Hex, {
      size: isArray ? 32 : null,
    }) as Address;
  }
  if (type === 'string') {
    return stringToHex(value as string);
  }
  if (type === 'bytes') {
    return value as Hex;
  }
  if (type === 'bool') {
    return pad(boolToHex(value as boolean), { size: isArray ? 32 : 1 });
  }

  const intMatch = (type as string).match(integerRegex);
  if (intMatch) {
    const [_type, baseType, bits = '256'] = intMatch;
    const size = Number.parseInt(bits) / 8;
    return numberToHex(value as number, {
      size: isArray ? 32 : size,
      signed: baseType === 'int',
    });
  }

  const bytesMatch = (type as string).match(bytesRegex);
  if (bytesMatch) {
    const [_type, size] = bytesMatch;
    if (Number.parseInt(size) !== ((value as Hex).length - 2) / 2) {
      throw new BytesSizeMismatchError({
        expectedSize: Number.parseInt(size),
        givenSize: ((value as Hex).length - 2) / 2,
      });
    }
    return pad(value as Hex, {
      dir: 'right',
      size: isArray ? 32 : null,
    }) as Hex;
  }

  const arrayMatch = (type as string).match(arrayRegex);
  if (arrayMatch && Array.isArray(value)) {
    const [_type, childType] = arrayMatch;
    const data: Hex[] = [];
    for (let i = 0; i < value.length; i++) {
      data.push(encode(childType, value[i], true));
    }
    if (data.length === 0) {
      return '0x';
    }
    return concatHex(data);
  }

  throw new UnsupportedPackedAbiType(type);
}
