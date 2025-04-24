/* eslint-disable @typescript-eslint/no-shadow */
import type { Abi, AbiEvent, AbiParameter } from 'abitype';

import type { Hex } from '../types/misc';
import { formatAbiItem, formatAbiParams } from '../utils/abi/formatAbiItem';
import { size } from '../utils/data/size';

import { BaseError } from './base';

export type AbiConstructorNotFoundErrorType = AbiConstructorNotFoundError & {
  name: 'AbiConstructorNotFoundError';
};
export class AbiConstructorNotFoundError extends BaseError {
  constructor({ docsPath }: { docsPath: string }) {
    super(
      [
        'A constructor was not found on the ABI.',
        'Make sure you are using the correct ABI and that the constructor exists on it.',
      ].join('\n'),
      {
        docsPath,
        name: 'AbiConstructorNotFoundError',
      },
    );
  }
}

export type AbiConstructorParamsNotFoundErrorType =
  AbiConstructorParamsNotFoundError & {
    name: 'AbiConstructorParamsNotFoundError';
  };

export class AbiConstructorParamsNotFoundError extends BaseError {
  constructor({ docsPath }: { docsPath: string }) {
    super(
      [
        'Constructor arguments were provided (`args`), but a constructor parameters (`inputs`) were not found on the ABI.',
        'Make sure you are using the correct ABI, and that the `inputs` attribute on the constructor exists.',
      ].join('\n'),
      {
        docsPath,
        name: 'AbiConstructorParamsNotFoundError',
      },
    );
  }
}

export type AbiDecodingDataSizeInvalidErrorType =
  AbiDecodingDataSizeInvalidError & {
    name: 'AbiDecodingDataSizeInvalidError';
  };
export class AbiDecodingDataSizeInvalidError extends BaseError {
  constructor({ data, size }: { data: Hex; size: number }) {
    super(
      [
        `Data size of ${size} bytes is invalid.`,
        'Size must be in increments of 32 bytes (size % 32 === 0).',
      ].join('\n'),
      {
        metaMessages: [`Data: ${data} (${size} bytes)`],
        name: 'AbiDecodingDataSizeInvalidError',
      },
    );
  }
}

export type AbiDecodingDataSizeTooSmallErrorType =
  AbiDecodingDataSizeTooSmallError & {
    name: 'AbiDecodingDataSizeTooSmallError';
  };
export class AbiDecodingDataSizeTooSmallError extends BaseError {
  data: Hex;

  params: readonly AbiParameter[];

  size: number;

  constructor({
    data,
    params,
    size,
  }: {
    data: Hex;
    params: readonly AbiParameter[];
    size: number;
  }) {
    super(
      [`Data size of ${size} bytes is too small for given parameters.`].join(
        '\n',
      ),
      {
        metaMessages: [
          `Params: (${formatAbiParams(params, { includeName: true })})`,
          `Data:   ${data} (${size} bytes)`,
        ],
        name: 'AbiDecodingDataSizeTooSmallError',
      },
    );

    this.data = data;
    this.params = params;
    this.size = size;
  }
}

export type AbiDecodingZeroDataErrorType = AbiDecodingZeroDataError & {
  name: 'AbiDecodingZeroDataError';
};
export class AbiDecodingZeroDataError extends BaseError {
  constructor() {
    super('Cannot decode zero data ("0x") with ABI parameters.', {
      name: 'AbiDecodingZeroDataError',
    });
  }
}

export type AbiEncodingArrayLengthMismatchErrorType =
  AbiEncodingArrayLengthMismatchError & {
    name: 'AbiEncodingArrayLengthMismatchError';
  };
export class AbiEncodingArrayLengthMismatchError extends BaseError {
  constructor({
    expectedLength,
    givenLength,
    type,
  }: {
    expectedLength: number;
    givenLength: number;
    type: string;
  }) {
    super(
      [
        `ABI encoding array length mismatch for type ${type}.`,
        `Expected length: ${expectedLength}`,
        `Given length: ${givenLength}`,
      ].join('\n'),
      { name: 'AbiEncodingArrayLengthMismatchError' },
    );
  }
}

export type AbiEncodingBytesSizeMismatchErrorType =
  AbiEncodingBytesSizeMismatchError & {
    name: 'AbiEncodingBytesSizeMismatchError';
  };
export class AbiEncodingBytesSizeMismatchError extends BaseError {
  constructor({ expectedSize, value }: { expectedSize: number; value: Hex }) {
    super(
      `Size of bytes "${value}" (bytes${size(
        value,
      )}) does not match expected size (bytes${expectedSize}).`,
      { name: 'AbiEncodingBytesSizeMismatchError' },
    );
  }
}

export type AbiEncodingLengthMismatchErrorType =
  AbiEncodingLengthMismatchError & {
    name: 'AbiEncodingLengthMismatchError';
  };
export class AbiEncodingLengthMismatchError extends BaseError {
  constructor({
    expectedLength,
    givenLength,
  }: {
    expectedLength: number;
    givenLength: number;
  }) {
    super(
      [
        'ABI encoding params/values length mismatch.',
        `Expected length (params): ${expectedLength}`,
        `Given length (values): ${givenLength}`,
      ].join('\n'),
      { name: 'AbiEncodingLengthMismatchError' },
    );
  }
}

export type AbiErrorInputsNotFoundErrorType = AbiErrorInputsNotFoundError & {
  name: 'AbiErrorInputsNotFoundError';
};
export class AbiErrorInputsNotFoundError extends BaseError {
  constructor(errorName: string, { docsPath }: { docsPath: string }) {
    super(
      [
        `Arguments (\`args\`) were provided to "${errorName}", but "${errorName}" on the ABI does not contain any parameters (\`inputs\`).`,
        'Cannot encode error result without knowing what the parameter types are.',
        'Make sure you are using the correct ABI and that the inputs exist on it.',
      ].join('\n'),
      {
        docsPath,
        name: 'AbiErrorInputsNotFoundError',
      },
    );
  }
}

export type AbiErrorNotFoundErrorType = AbiErrorNotFoundError & {
  name: 'AbiErrorNotFoundError';
};
export class AbiErrorNotFoundError extends BaseError {
  constructor(
    errorName?: string | undefined,
    { docsPath }: { docsPath?: string | undefined } = {},
  ) {
    super(
      [
        `Error ${errorName ? `"${errorName}" ` : ''}not found on ABI.`,
        'Make sure you are using the correct ABI and that the error exists on it.',
      ].join('\n'),
      {
        docsPath,
        name: 'AbiErrorNotFoundError',
      },
    );
  }
}

export type AbiErrorSignatureNotFoundErrorType =
  AbiErrorSignatureNotFoundError & {
    name: 'AbiErrorSignatureNotFoundError';
  };
export class AbiErrorSignatureNotFoundError extends BaseError {
  signature: Hex;

  constructor(signature: Hex, { docsPath }: { docsPath: string }) {
    super(
      [
        `Encoded error signature "${signature}" not found on ABI.`,
        'Make sure you are using the correct ABI and that the error exists on it.',
        `You can look up the decoded signature here: https://openchain.xyz/signatures?query=${signature}.`,
      ].join('\n'),
      {
        docsPath,
        name: 'AbiErrorSignatureNotFoundError',
      },
    );
    this.signature = signature;
  }
}

export type AbiEventSignatureEmptyTopicsErrorType =
  AbiEventSignatureEmptyTopicsError & {
    name: 'AbiEventSignatureEmptyTopicsError';
  };
export class AbiEventSignatureEmptyTopicsError extends BaseError {
  constructor({ docsPath }: { docsPath: string }) {
    super('Cannot extract event signature from empty topics.', {
      docsPath,
      name: 'AbiEventSignatureEmptyTopicsError',
    });
  }
}

export type AbiEventSignatureNotFoundErrorType =
  AbiEventSignatureNotFoundError & {
    name: 'AbiEventSignatureNotFoundError';
  };
export class AbiEventSignatureNotFoundError extends BaseError {
  constructor(signature: Hex, { docsPath }: { docsPath: string }) {
    super(
      [
        `Encoded event signature "${signature}" not found on ABI.`,
        'Make sure you are using the correct ABI and that the event exists on it.',
        `You can look up the signature here: https://openchain.xyz/signatures?query=${signature}.`,
      ].join('\n'),
      {
        docsPath,
        name: 'AbiEventSignatureNotFoundError',
      },
    );
  }
}

export type AbiEventNotFoundErrorType = AbiEventNotFoundError & {
  name: 'AbiEventNotFoundError';
};
export class AbiEventNotFoundError extends BaseError {
  constructor(
    eventName?: string | undefined,
    { docsPath }: { docsPath?: string | undefined } = {},
  ) {
    super(
      [
        `Event ${eventName ? `"${eventName}" ` : ''}not found on ABI.`,
        'Make sure you are using the correct ABI and that the event exists on it.',
      ].join('\n'),
      {
        docsPath,
        name: 'AbiEventNotFoundError',
      },
    );
  }
}

export type AbiFunctionNotFoundErrorType = AbiFunctionNotFoundError & {
  name: 'AbiFunctionNotFoundError';
};
export class AbiFunctionNotFoundError extends BaseError {
  constructor(
    functionName?: string | undefined,
    { docsPath }: { docsPath?: string | undefined } = {},
  ) {
    super(
      [
        `Function ${functionName ? `"${functionName}" ` : ''}not found on ABI.`,
        'Make sure you are using the correct ABI and that the function exists on it.',
      ].join('\n'),
      {
        docsPath,
        name: 'AbiFunctionNotFoundError',
      },
    );
  }
}

export type AbiFunctionOutputsNotFoundErrorType =
  AbiFunctionOutputsNotFoundError & {
    name: 'AbiFunctionOutputsNotFoundError';
  };
export class AbiFunctionOutputsNotFoundError extends BaseError {
  constructor(functionName: string, { docsPath }: { docsPath: string }) {
    super(
      [
        `Function "${functionName}" does not contain any \`outputs\` on ABI.`,
        'Cannot decode function result without knowing what the parameter types are.',
        'Make sure you are using the correct ABI and that the function exists on it.',
      ].join('\n'),
      {
        docsPath,
        name: 'AbiFunctionOutputsNotFoundError',
      },
    );
  }
}

export type AbiFunctionSignatureNotFoundErrorType =
  AbiFunctionSignatureNotFoundError & {
    name: 'AbiFunctionSignatureNotFoundError';
  };
export class AbiFunctionSignatureNotFoundError extends BaseError {
  constructor(signature: Hex, { docsPath }: { docsPath: string }) {
    super(
      [
        `Encoded function signature "${signature}" not found on ABI.`,
        'Make sure you are using the correct ABI and that the function exists on it.',
        `You can look up the signature here: https://openchain.xyz/signatures?query=${signature}.`,
      ].join('\n'),
      {
        docsPath,
        name: 'AbiFunctionSignatureNotFoundError',
      },
    );
  }
}

export type AbiItemAmbiguityErrorType = AbiItemAmbiguityError & {
  name: 'AbiItemAmbiguityError';
};
export class AbiItemAmbiguityError extends BaseError {
  constructor(
    x: { abiItem: Abi[number]; type: string },
    y: { abiItem: Abi[number]; type: string },
  ) {
    super('Found ambiguous types in overloaded ABI items.', {
      metaMessages: [
        `\`${x.type}\` in \`${formatAbiItem(x.abiItem)}\`, and`,
        `\`${y.type}\` in \`${formatAbiItem(y.abiItem)}\``,
        '',
        'These types encode differently and cannot be distinguished at runtime.',
        'Remove one of the ambiguous items in the ABI.',
      ],
      name: 'AbiItemAmbiguityError',
    });
  }
}

export type BytesSizeMismatchErrorType = BytesSizeMismatchError & {
  name: 'BytesSizeMismatchError';
};
export class BytesSizeMismatchError extends BaseError {
  constructor({
    expectedSize,
    givenSize,
  }: {
    expectedSize: number;
    givenSize: number;
  }) {
    super(`Expected bytes${expectedSize}, got bytes${givenSize}.`, {
      name: 'BytesSizeMismatchError',
    });
  }
}

export type DecodeLogDataMismatchErrorType = DecodeLogDataMismatch & {
  name: 'DecodeLogDataMismatch';
};
export class DecodeLogDataMismatch extends BaseError {
  abiItem: AbiEvent;

  data: Hex;

  params: readonly AbiParameter[];

  size: number;

  constructor({
    abiItem,
    data,
    params,
    size,
  }: {
    abiItem: AbiEvent;
    data: Hex;
    params: readonly AbiParameter[];
    size: number;
  }) {
    super(
      [
        `Data size of ${size} bytes is too small for non-indexed event parameters.`,
      ].join('\n'),
      {
        metaMessages: [
          `Params: (${formatAbiParams(params, { includeName: true })})`,
          `Data:   ${data} (${size} bytes)`,
        ],
        name: 'DecodeLogDataMismatch',
      },
    );

    this.abiItem = abiItem;
    this.data = data;
    this.params = params;
    this.size = size;
  }
}

export type DecodeLogTopicsMismatchErrorType = DecodeLogTopicsMismatch & {
  name: 'DecodeLogTopicsMismatch';
};
export class DecodeLogTopicsMismatch extends BaseError {
  abiItem: AbiEvent;

  constructor({
    abiItem,
    param,
  }: {
    abiItem: AbiEvent;
    param: AbiParameter & { indexed: boolean };
  }) {
    super(
      [
        `Expected a topic for indexed event parameter${
          param.name ? ` "${param.name}"` : ''
        } on event "${formatAbiItem(abiItem, { includeName: true })}".`,
      ].join('\n'),
      { name: 'DecodeLogTopicsMismatch' },
    );

    this.abiItem = abiItem;
  }
}

export type InvalidAbiEncodingTypeErrorType = InvalidAbiEncodingTypeError & {
  name: 'InvalidAbiEncodingTypeError';
};
export class InvalidAbiEncodingTypeError extends BaseError {
  constructor(type: string, { docsPath }: { docsPath: string }) {
    super(
      [
        `Type "${type}" is not a valid encoding type.`,
        'Please provide a valid ABI type.',
      ].join('\n'),
      { docsPath, name: 'InvalidAbiEncodingType' },
    );
  }
}

export type InvalidAbiDecodingTypeErrorType = InvalidAbiDecodingTypeError & {
  name: 'InvalidAbiDecodingTypeError';
};
export class InvalidAbiDecodingTypeError extends BaseError {
  constructor(type: string, { docsPath }: { docsPath: string }) {
    super(
      [
        `Type "${type}" is not a valid decoding type.`,
        'Please provide a valid ABI type.',
      ].join('\n'),
      { docsPath, name: 'InvalidAbiDecodingType' },
    );
  }
}

export type InvalidArrayErrorType = InvalidArrayError & {
  name: 'InvalidArrayError';
};
export class InvalidArrayError extends BaseError {
  constructor(value: unknown) {
    super([`Value "${value}" is not a valid array.`].join('\n'), {
      name: 'InvalidArrayError',
    });
  }
}

export type InvalidDefinitionTypeErrorType = InvalidDefinitionTypeError & {
  name: 'InvalidDefinitionTypeError';
};
export class InvalidDefinitionTypeError extends BaseError {
  constructor(type: string) {
    super(
      [
        `"${type}" is not a valid definition type.`,
        'Valid types: "function", "event", "error"',
      ].join('\n'),
      { name: 'InvalidDefinitionTypeError' },
    );
  }
}

export type UnsupportedPackedAbiTypeErrorType = UnsupportedPackedAbiType & {
  name: 'UnsupportedPackedAbiType';
};
export class UnsupportedPackedAbiType extends BaseError {
  constructor(type: unknown) {
    super(`Type "${type}" is not supported for packed encoding.`, {
      name: 'UnsupportedPackedAbiType',
    });
  }
}
