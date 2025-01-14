import { MessageTypes } from '@metamask/eth-sig-util';

type MessageValue =
  | string
  | number
  | boolean
  | Record<string, unknown>
  | MessageValue[];

type SanitizedMessage = {
  value: MessageValue;
  type: string;
};

const solidityTypes = (): string[] => {
  const types = [
    'bool',
    'address',
    'string',
    'bytes',
    'int',
    'uint',
    'fixed',
    'ufixed',
  ];

  const ints = Array.from(new Array(32)).map(
    (_, index) => `int${(index + 1) * 8}`,
  );
  const uints = Array.from(new Array(32)).map(
    (_, index) => `uint${(index + 1) * 8}`,
  );
  const bytes = Array.from(new Array(32)).map(
    (_, index) => `bytes${index + 1}`,
  );

  const fixedM = Array.from(new Array(32)).map(
    (_, index) => `fixed${(index + 1) * 8}`,
  );
  const ufixedM = Array.from(new Array(32)).map(
    (_, index) => `ufixed${(index + 1) * 8}`,
  );
  const fixed = Array.from(new Array(80)).map((_, index) =>
    fixedM.map((aFixedM) => `${aFixedM}x${index + 1}`),
  );
  const ufixed = Array.from(new Array(80)).map((_, index) =>
    ufixedM.map((auFixedM) => `${auFixedM}x${index + 1}`),
  );

  return [
    ...types,
    ...ints,
    ...uints,
    ...bytes,
    ...fixed.flat(),
    ...ufixed.flat(),
  ];
};

const SOLIDITY_TYPES = solidityTypes();

const stripArrayType = (potentialArrayType: string): string =>
  potentialArrayType.replace(/\[[0-9]*\]*/gu, '');

export const stripOneLayerofNesting = (potentialArrayType: string): string =>
  potentialArrayType.replace(/\[(\d*)\]/u, '');

const isArrayType = (potentialArrayType: string): boolean =>
  potentialArrayType.match(/\[[0-9]*\]*/u) !== null;

const isSolidityType = (type: string): boolean => SOLIDITY_TYPES.includes(type);

export const sanitizeMessage = (
  msg: MessageValue,
  primaryType: string,
  types: MessageTypes,
): SanitizedMessage => {
  if (!types) {
    throw new Error(`Invalid types definition`);
  }

  // Primary type can be an array.
  const isArray = primaryType && isArrayType(primaryType);
  if (isArray) {
    if (!Array.isArray(msg)) {
      throw new Error(`Expected array for type ${primaryType}`);
    }
    return {
      value: msg.map((value) =>
        sanitizeMessage(value, stripOneLayerofNesting(primaryType), types),
      ),
      type: primaryType,
    };
  } else if (isSolidityType(primaryType)) {
    return { value: msg, type: primaryType };
  }

  // If not, assume to be struct
  const baseType = isArray ? stripArrayType(primaryType) : primaryType;

  const baseTypeDefinitions = types[baseType];
  if (!baseTypeDefinitions) {
    throw new Error(`Invalid primary type definition`);
  }

  if (typeof msg !== 'object' || msg === null) {
    throw new Error(`Expected object for type ${primaryType}`);
  }

  const sanitizedStruct: Record<string, SanitizedMessage> = {};
  const msgKeys = Object.keys(msg);
  msgKeys.forEach((msgKey) => {
    const definedType = baseTypeDefinitions.find(
      (baseTypeDefinition) => baseTypeDefinition.name === msgKey,
    );

    if (!definedType) {
      return;
    }

    sanitizedStruct[msgKey] = sanitizeMessage(
      (msg as Record<string, MessageValue>)[msgKey],
      definedType.type,
      types,
    );
  });
  return { value: sanitizedStruct, type: primaryType };
};


/**
 * Recursively sanitizes a message object based on the provided types and primary type.
 *
 * @param message - The message object to sanitize.
 * @param types - The types defined in the typed message.
 * @param primaryType - The primary type of the message.
 * @returns The sanitized message object.
 */
export function sanitizeMessageRecursively<T extends MessageTypes>(
  message: Record<string, unknown>,
  types: T,
  primaryType: string | number,
): Record<string, unknown> {
  const sanitizedMessage: Record<string, unknown> = {};
  const typeDefinition = types[primaryType];

  if (!typeDefinition) {
    return message;
  }

  for (const field of typeDefinition) {
    const { name, type } = field;
    if (message[name] !== undefined) {
      if (types[type]) {
        sanitizedMessage[name] = sanitizeMessageRecursively(
          message[name] as Record<string, unknown>,
          types,
          type,
        );
      } else {
        sanitizedMessage[name] = message[name];
      }
    }
  }

  return sanitizedMessage;
}

/**
 * Parses and sanitizes a typed data message.
 *
 * @param dataToParse - The string representation of the typed data message.
 * @returns The sanitized typed message object and the primary type.
 */
// export function parseAndSanitizeTypedDataMessage<T extends MessageTypes>(
//   dataToParse: string,
// ): { sanitizedMessage: TypedMessage<T>; primaryType: string | number } {
//   const typedMessage = parseTypedDataMessage(dataToParse);
//   const { message, primaryType, types } =
//     TypedDataUtils.sanitizeData(typedMessage);

//   const sanitizedMessage = {
//     ...typedMessage,
//     message: sanitizeMessageRecursively(message, types, primaryType),
//   } as TypedMessage<T>;

//   return { sanitizedMessage, primaryType };
// }