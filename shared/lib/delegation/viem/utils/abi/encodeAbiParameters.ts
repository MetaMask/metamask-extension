import type {
  AbiParameter,
  AbiParameterToPrimitiveType,
  AbiParametersToPrimitiveTypes,
} from 'abitype';

import {
  AbiEncodingArrayLengthMismatchError,
  type AbiEncodingArrayLengthMismatchErrorType,
  AbiEncodingBytesSizeMismatchError,
  type AbiEncodingBytesSizeMismatchErrorType,
  AbiEncodingLengthMismatchError,
  type AbiEncodingLengthMismatchErrorType,
  InvalidAbiEncodingTypeError,
  type InvalidAbiEncodingTypeErrorType,
  InvalidArrayError,
  type InvalidArrayErrorType,
} from '../../errors/abi';
import {
  InvalidAddressError,
  type InvalidAddressErrorType,
} from '../../errors/address';
import { BaseError } from '../../errors/base';
import { IntegerOutOfRangeError } from '../../errors/encoding';
import type { ErrorType } from '../../errors/utils';
import type { Hex } from '../../types/misc';
import { type IsAddressErrorType, isAddress } from '../address/isAddress';
import { type ConcatErrorType, concat } from '../data/concat';
import { type PadHexErrorType, padHex } from '../data/pad';
import { type SizeErrorType, size } from '../data/size';
import { type SliceErrorType, slice } from '../data/slice';
import {
  type BoolToHexErrorType,
  type NumberToHexErrorType,
  type StringToHexErrorType,
  boolToHex,
  numberToHex,
  stringToHex,
} from '../encoding/toHex';
import { integerRegex } from '../regex';

export type EncodeAbiParametersReturnType = Hex;

export type EncodeAbiParametersErrorType =
  | AbiEncodingLengthMismatchErrorType
  | PrepareParamsErrorType
  | EncodeParamsErrorType
  | ErrorType;

/**
 * @description Encodes a list of primitive values into an ABI-encoded hex value.
 *
 * - Docs: https://viem.sh/docs/abi/encodeAbiParameters#encodeabiparameters
 *
 *   Generates ABI encoded data using the [ABI specification](https://docs.soliditylang.org/en/latest/abi-spec), given a set of ABI parameters (inputs/outputs) and their corresponding values.
 * @param params - a set of ABI Parameters (params), that can be in the shape of the inputs or outputs attribute of an ABI Item.
 * @param values - a set of values (values) that correspond to the given params.
 * @example
 * ```typescript
 * import { encodeAbiParameters } from 'viem'
 *
 * const encodedData = encodeAbiParameters(
 *   [
 *     { name: 'x', type: 'string' },
 *     { name: 'y', type: 'uint' },
 *     { name: 'z', type: 'bool' }
 *   ],
 *   ['wagmi', 420n, true]
 * )
 * ```
 *
 * You can also pass in Human Readable parameters with the parseAbiParameters utility.
 * @example
 * ```typescript
 * import { encodeAbiParameters, parseAbiParameters } from 'viem'
 *
 * const encodedData = encodeAbiParameters(
 *   parseAbiParameters('string x, uint y, bool z'),
 *   ['wagmi', 420n, true]
 * )
 * ```
 */
export function encodeAbiParameters<
  const params extends readonly AbiParameter[] | readonly unknown[],
>(
  params: params,
  values: params extends readonly AbiParameter[]
    ? AbiParametersToPrimitiveTypes<params>
    : never,
): EncodeAbiParametersReturnType {
  if (params.length !== values.length) {
    throw new AbiEncodingLengthMismatchError({
      expectedLength: params.length as number,
      givenLength: values.length as any,
    });
  }
  // Prepare the parameters to determine dynamic types to encode.
  const preparedParams = prepareParams({
    params: params as readonly AbiParameter[],
    values: values as any,
  });
  const data = encodeParams(preparedParams);
  if (data.length === 0) {
    return '0x';
  }
  return data;
}

// ///////////////////////////////////////////////////////////////

type PreparedParam = { dynamic: boolean; encoded: Hex };

type TupleAbiParameter = AbiParameter & { components: readonly AbiParameter[] };
type Tuple = AbiParameterToPrimitiveType<TupleAbiParameter>;

type PrepareParamsErrorType = PrepareParamErrorType | ErrorType;

function prepareParams<const params extends readonly AbiParameter[]>({
  params,
  values,
}: {
  params: params;
  values: AbiParametersToPrimitiveTypes<params>;
}) {
  const preparedParams: PreparedParam[] = [];
  for (let i = 0; i < params.length; i++) {
    preparedParams.push(prepareParam({ param: params[i], value: values[i] }));
  }
  return preparedParams;
}

type PrepareParamErrorType =
  | EncodeAddressErrorType
  | EncodeArrayErrorType
  | EncodeBytesErrorType
  | EncodeBoolErrorType
  | EncodeNumberErrorType
  | EncodeStringErrorType
  | EncodeTupleErrorType
  | GetArrayComponentsErrorType
  | InvalidAbiEncodingTypeErrorType
  | ErrorType;

function prepareParam<const param extends AbiParameter>({
  param,
  value,
}: {
  param: param;
  value: AbiParameterToPrimitiveType<param>;
}): PreparedParam {
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents) {
    const [length, type] = arrayComponents;
    return encodeArray(value, { length, param: { ...param, type } });
  }
  if (param.type === 'tuple') {
    return encodeTuple(value as unknown as Tuple, {
      param: param as TupleAbiParameter,
    });
  }
  if (param.type === 'address') {
    return encodeAddress(value as unknown as Hex);
  }
  if (param.type === 'bool') {
    return encodeBool(value as unknown as boolean);
  }
  if (param.type.startsWith('uint') || param.type.startsWith('int')) {
    const signed = param.type.startsWith('int');
    const [, , size = '256'] = integerRegex.exec(param.type) ?? [];
    return encodeNumber(value as unknown as number, {
      signed,
      size: Number(size),
    });
  }
  if (param.type.startsWith('bytes')) {
    return encodeBytes(value as unknown as Hex, { param });
  }
  if (param.type === 'string') {
    return encodeString(value as unknown as string);
  }
  throw new InvalidAbiEncodingTypeError(param.type, {
    docsPath: '/docs/contract/encodeAbiParameters',
  });
}

// ///////////////////////////////////////////////////////////////

type EncodeParamsErrorType = NumberToHexErrorType | SizeErrorType | ErrorType;

function encodeParams(preparedParams: PreparedParam[]): Hex {
  // 1. Compute the size of the static part of the parameters.
  let staticSize = 0;
  for (let i = 0; i < preparedParams.length; i++) {
    const { dynamic, encoded } = preparedParams[i];
    if (dynamic) {
      staticSize += 32;
    } else {
      staticSize += size(encoded);
    }
  }

  // 2. Split the parameters into static and dynamic parts.
  const staticParams: Hex[] = [];
  const dynamicParams: Hex[] = [];
  let dynamicSize = 0;
  for (let i = 0; i < preparedParams.length; i++) {
    const { dynamic, encoded } = preparedParams[i];
    if (dynamic) {
      staticParams.push(numberToHex(staticSize + dynamicSize, { size: 32 }));
      dynamicParams.push(encoded);
      dynamicSize += size(encoded);
    } else {
      staticParams.push(encoded);
    }
  }

  // 3. Concatenate static and dynamic parts.
  return concat([...staticParams, ...dynamicParams]);
}

// ///////////////////////////////////////////////////////////////

type EncodeAddressErrorType =
  | InvalidAddressErrorType
  | IsAddressErrorType
  | ErrorType;

function encodeAddress(value: Hex): PreparedParam {
  if (!isAddress(value)) {
    throw new InvalidAddressError({ address: value });
  }
  return { dynamic: false, encoded: padHex(value.toLowerCase() as Hex) };
}

type EncodeArrayErrorType =
  | AbiEncodingArrayLengthMismatchErrorType
  | ConcatErrorType
  | EncodeParamsErrorType
  | InvalidArrayErrorType
  | NumberToHexErrorType
  // TODO: Add back once circular type reference is resolved
  // | PrepareParamErrorType
  | ErrorType;

function encodeArray<const param extends AbiParameter>(
  value: AbiParameterToPrimitiveType<param>,
  {
    length,
    param,
  }: {
    length: number | null;
    param: param;
  },
): PreparedParam {
  const dynamic = length === null;

  if (!Array.isArray(value)) {
    throw new InvalidArrayError(value);
  }
  if (!dynamic && value.length !== length) {
    throw new AbiEncodingArrayLengthMismatchError({
      expectedLength: length!,
      givenLength: value.length,
      type: `${param.type}[${length}]`,
    });
  }

  let dynamicChild = false;
  const preparedParams: PreparedParam[] = [];
  for (let i = 0; i < value.length; i++) {
    const preparedParam = prepareParam({ param, value: value[i] });
    if (preparedParam.dynamic) {
      dynamicChild = true;
    }
    preparedParams.push(preparedParam);
  }

  if (dynamic || dynamicChild) {
    const data = encodeParams(preparedParams);
    if (dynamic) {
      const length = numberToHex(preparedParams.length, { size: 32 });
      return {
        dynamic: true,
        encoded: preparedParams.length > 0 ? concat([length, data]) : length,
      };
    }
    if (dynamicChild) {
      return { dynamic: true, encoded: data };
    }
  }
  return {
    dynamic: false,
    encoded: concat(preparedParams.map(({ encoded }) => encoded)),
  };
}

type EncodeBytesErrorType =
  | AbiEncodingBytesSizeMismatchErrorType
  | ConcatErrorType
  | PadHexErrorType
  | NumberToHexErrorType
  | SizeErrorType
  | ErrorType;

function encodeBytes<const param extends AbiParameter>(
  value: Hex,
  { param }: { param: param },
): PreparedParam {
  const [, paramSize] = param.type.split('bytes');
  const bytesSize = size(value);
  if (!paramSize) {
    let value_ = value;
    // If the size is not divisible by 32 bytes, pad the end
    // with empty bytes to the ceiling 32 bytes.
    if (bytesSize % 32 !== 0) {
      value_ = padHex(value_, {
        dir: 'right',
        size: Math.ceil((value.length - 2) / 2 / 32) * 32,
      });
    }
    return {
      dynamic: true,
      encoded: concat([padHex(numberToHex(bytesSize, { size: 32 })), value_]),
    };
  }
  if (bytesSize !== Number.parseInt(paramSize)) {
    throw new AbiEncodingBytesSizeMismatchError({
      expectedSize: Number.parseInt(paramSize),
      value,
    });
  }
  return { dynamic: false, encoded: padHex(value, { dir: 'right' }) };
}

type EncodeBoolErrorType = PadHexErrorType | BoolToHexErrorType | ErrorType;

function encodeBool(value: boolean): PreparedParam {
  if (typeof value !== 'boolean') {
    throw new BaseError(
      `Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`,
    );
  }
  return { dynamic: false, encoded: padHex(boolToHex(value)) };
}

type EncodeNumberErrorType = NumberToHexErrorType | ErrorType;

function encodeNumber(
  value: number,
  { signed, size = 256 }: { signed: boolean; size?: number | undefined },
): PreparedParam {
  if (typeof size === 'number') {
    const max = 2n ** (BigInt(size) - (signed ? 1n : 0n)) - 1n;
    const min = signed ? -max - 1n : 0n;
    if (value > max || value < min) {
      throw new IntegerOutOfRangeError({
        max: max.toString(),
        min: min.toString(),
        signed,
        size: size / 8,
        value: value.toString(),
      });
    }
  }
  return {
    dynamic: false,
    encoded: numberToHex(value, {
      size: 32,
      signed,
    }),
  };
}

type EncodeStringErrorType =
  | ConcatErrorType
  | NumberToHexErrorType
  | PadHexErrorType
  | SizeErrorType
  | SliceErrorType
  | StringToHexErrorType
  | ErrorType;

function encodeString(value: string): PreparedParam {
  const hexValue = stringToHex(value);
  const partsLength = Math.ceil(size(hexValue) / 32);
  const parts: Hex[] = [];
  for (let i = 0; i < partsLength; i++) {
    parts.push(
      padHex(slice(hexValue, i * 32, (i + 1) * 32), {
        dir: 'right',
      }),
    );
  }
  return {
    dynamic: true,
    encoded: concat([
      padHex(numberToHex(size(hexValue), { size: 32 })),
      ...parts,
    ]),
  };
}

type EncodeTupleErrorType =
  | ConcatErrorType
  | EncodeParamsErrorType
  // TODO: Add back once circular type reference is resolved
  // | PrepareParamErrorType
  | ErrorType;

function encodeTuple<
  const param extends AbiParameter & { components: readonly AbiParameter[] },
>(
  value: AbiParameterToPrimitiveType<param>,
  { param }: { param: param },
): PreparedParam {
  let dynamic = false;
  const preparedParams: PreparedParam[] = [];
  for (let i = 0; i < param.components.length; i++) {
    const param_ = param.components[i];
    const index = Array.isArray(value) ? i : param_.name;
    const preparedParam = prepareParam({
      param: param_,
      value: (value as any)[index!] as readonly unknown[],
    });
    preparedParams.push(preparedParam);
    if (preparedParam.dynamic) {
      dynamic = true;
    }
  }
  return {
    dynamic,
    encoded: dynamic
      ? encodeParams(preparedParams)
      : concat(preparedParams.map(({ encoded }) => encoded)),
  };
}

type GetArrayComponentsErrorType = ErrorType;

export function getArrayComponents(
  type: string,
): [length: number | null, innerType: string] | undefined {
  const matches = type.match(/^(.*)\[(\d+)?\]$/);
  return matches
    ? // Return `null` if the array is dynamic.
      [matches[2] ? Number(matches[2]) : null, matches[1]]
    : undefined;
}
