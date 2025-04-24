/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  TypedData,
  TypedDataDomain,
  TypedDataToPrimitiveTypes,
} from 'abitype';

import type { Prettify } from './utils';

export type TypedDataDefinition<
  typedData extends TypedData | Record<string, unknown> = TypedData,
  primaryType extends keyof typedData | 'EIP712Domain' = keyof typedData,
  primaryTypes = typedData extends TypedData ? keyof typedData : string,
> = primaryType extends 'EIP712Domain'
  ? EIP712DomainDefinition<typedData, primaryType>
  : MessageDefinition<typedData, primaryType, primaryTypes>;

type MessageDefinition<
  typedData extends TypedData | Record<string, unknown> = TypedData,
  primaryType extends keyof typedData = keyof typedData,
  primaryTypes = typedData extends TypedData ? keyof typedData : string,
  schema extends Record<string, unknown> = typedData extends TypedData
    ? TypedDataToPrimitiveTypes<typedData>
    : Record<string, unknown>,
  message = schema[primaryType extends keyof schema
    ? primaryType
    : keyof schema],
> = {
  types: typedData;
} & {
  primaryType:
    | primaryTypes // show all values
    | (primaryType extends primaryTypes ? primaryType : never); // infer value
  domain?:
    | (schema extends { EIP712Domain: infer domain }
        ? domain
        : Prettify<TypedDataDomain>)
    | undefined;
  message: { [_: string]: any } extends message // Check if message was inferred
    ? Record<string, unknown>
    : message;
};

type EIP712DomainDefinition<
  typedData extends TypedData | Record<string, unknown> = TypedData,
  primaryType extends 'EIP712Domain' = 'EIP712Domain',
  schema extends Record<string, unknown> = typedData extends TypedData
    ? TypedDataToPrimitiveTypes<typedData>
    : Record<string, unknown>,
> = {
  types?: typedData | undefined;
} & {
  primaryType: 'EIP712Domain' | primaryType;
  domain: schema extends { EIP712Domain: infer domain }
    ? domain
    : Prettify<TypedDataDomain>;
  message?: undefined;
};
