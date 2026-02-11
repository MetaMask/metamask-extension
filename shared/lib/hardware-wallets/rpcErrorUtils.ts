import { JsonRpcError } from '@metamask/rpc-errors';
import {
  HardwareWalletError,
  ErrorCode,
  Severity,
  Category,
  LEDGER_ERROR_MAPPINGS,
} from '@metamask/hw-wallet-sdk';
import {
  is,
  object,
  type as superstructType,
  string,
  number,
  literal,
  enums,
  optional,
  record,
  unknown,
  union,
  type Infer,
} from '@metamask/superstruct';
import { KeyringControllerError } from '@metamask/keyring-controller';

type HardwareWalletType = string;

const LegacySerializedHardwareWalletErrorCauseStruct = object({
  name: literal('HardwareWalletError'),
  message: string(),
  stack: optional(string()),
  code: number(),
});

const ExtendedSerializedHardwareWalletErrorCauseStruct = object({
  category: string(),
  severity: string(),
  id: string(),
  userMessage: string(),
  timestamp: string(),
  name: literal('HardwareWalletError'),
  message: string(),
  stack: optional(string()),
  code: number(),
});

const SerializedHardwareWalletErrorCauseStruct = union([
  LegacySerializedHardwareWalletErrorCauseStruct,
  ExtendedSerializedHardwareWalletErrorCauseStruct,
]);

const HardwareWalletSeverityStruct = enums(Object.values(Severity));

const HardwareWalletCategoryStruct = enums(Object.values(Category));

const SerializedRpcHardwareWalletErrorStruct = superstructType({
  data: superstructType({
    cause: SerializedHardwareWalletErrorCauseStruct,
    metadata: optional(record(string(), unknown())),
  }),
  code: number(),
});

const HardwareWalletErrorDataStruct = superstructType({
  code: union([string(), number()]),
  severity: optional(HardwareWalletSeverityStruct),
  category: optional(HardwareWalletCategoryStruct),
  userMessage: optional(string()),
  metadata: optional(record(string(), unknown())),
});

const DeserializedJsonRpcHardwareWalletErrorStruct = superstructType({
  message: optional(string()),
  code: optional(number()),
  stack: optional(string()),
  data: HardwareWalletErrorDataStruct,
});

type SerializedHardwareWalletErrorCause = Infer<
  typeof SerializedHardwareWalletErrorCauseStruct
>;
type SerializedRpcHardwareWalletError = Infer<
  typeof SerializedRpcHardwareWalletErrorStruct
>;
type HardwareWalletErrorData = Infer<typeof HardwareWalletErrorDataStruct>;
type DeserializedJsonRpcHardwareWalletError = Infer<
  typeof DeserializedJsonRpcHardwareWalletErrorStruct
>;

const ERROR_PROPERTIES_MAP = (() => {
  const map = new Map<
    ErrorCode,
    {
      severity: Severity;
      category: Category;
      userMessage: string;
    }
  >();

  for (const mapping of Object.values(LEDGER_ERROR_MAPPINGS)) {
    if (mapping.code && typeof mapping.code === 'number') {
      map.set(mapping.code, {
        severity: mapping.severity ?? Severity.Err,
        category: mapping.category ?? Category.Unknown,
        userMessage: mapping.userMessage ?? 'An error occurred',
      });
    }
  }

  return map;
})();

function createHardwareWalletError(
  code: ErrorCode,
  walletType: HardwareWalletType,
  message?: string,
  options?: {
    cause?: Error;
    metadata?: Record<string, unknown>;
  },
): HardwareWalletError {
  const properties = ERROR_PROPERTIES_MAP.get(code) ?? {
    severity: Severity.Err,
    category: Category.Unknown,
    userMessage: 'An unknown error occurred',
  };

  return new HardwareWalletError(message || properties.userMessage, {
    code,
    severity: properties.severity,
    category: properties.category,
    userMessage: properties.userMessage,
    cause: options?.cause,
    metadata: {
      ...options?.metadata,
      walletType,
    },
  });
}

function isSerializedRpcHardwareWalletError(
  error: unknown,
): error is SerializedRpcHardwareWalletError {
  return is(error, SerializedRpcHardwareWalletErrorStruct);
}

function isDeserializedJsonRpcHardwareWalletError(
  error: unknown,
): error is DeserializedJsonRpcHardwareWalletError {
  return is(error, DeserializedJsonRpcHardwareWalletErrorStruct);
}

function isJsonRpcHardwareWalletError(
  error: unknown,
): error is JsonRpcError<HardwareWalletErrorData> & {
  data: HardwareWalletErrorData;
} {
  if (error instanceof JsonRpcError) {
    return is(error.data, HardwareWalletErrorDataStruct);
  }
  return isDeserializedJsonRpcHardwareWalletError(error);
}

function mapNumericCodeToErrorCode(numericCode: number): ErrorCode {
  const errorCodeValues = Object.values(ErrorCode).filter(
    (v): v is number => typeof v === 'number',
  );

  if (errorCodeValues.includes(numericCode)) {
    return numericCode as ErrorCode;
  }

  return ErrorCode.Unknown;
}

function mapStringCodeToErrorCode(stringCode: string): ErrorCode {
  const numericCode = parseInt(stringCode, 10);
  if (!Number.isNaN(numericCode)) {
    return mapNumericCodeToErrorCode(numericCode);
  }

  const errorCodeKey = stringCode as keyof typeof ErrorCode;
  if (errorCodeKey in ErrorCode) {
    return ErrorCode[errorCodeKey];
  }

  return ErrorCode.Unknown;
}

function mapCodeToErrorCode(code: string | number): ErrorCode {
  return typeof code === 'number'
    ? mapNumericCodeToErrorCode(code)
    : mapStringCodeToErrorCode(code);
}

function mapLedgerStatusCodeToErrorCode(statusCode: string): ErrorCode {
  const mapping =
    LEDGER_ERROR_MAPPINGS[statusCode as keyof typeof LEDGER_ERROR_MAPPINGS];
  return mapping?.code ?? ErrorCode.Unknown;
}

function extractHexStatusCodeFromMessage(message: string): string | null {
  const hexMatch = message.match(/0x[\da-fA-F]{4}/u);
  return hexMatch ? hexMatch[0].toLowerCase() : null;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  const errObj = err as { message?: string };
  if (errObj?.message && typeof errObj.message === 'string') {
    return errObj.message;
  }
  return String(err);
}

function convertSerializedCauseToHardwareWalletError(
  cause: SerializedHardwareWalletErrorCause,
  walletType: HardwareWalletType,
  parentData?: { metadata?: Record<string, unknown> },
): HardwareWalletError {
  const errorCode = mapNumericCodeToErrorCode(cause.code);
  const metadata = parentData?.metadata;

  const hwError = createHardwareWalletError(
    errorCode,
    walletType,
    cause.message,
    { metadata },
  );

  if (cause.stack) {
    hwError.stack = cause.stack;
  }

  return hwError;
}

function convertDataToHardwareWalletError(
  data: HardwareWalletErrorData,
  message: string,
  walletType: HardwareWalletType,
  stack?: string,
): HardwareWalletError {
  let errorCode = mapCodeToErrorCode(data.code);

  if (errorCode === ErrorCode.Unknown && walletType === 'ledger') {
    const numericCode =
      typeof data.code === 'number' ? data.code : parseInt(data.code, 10);
    if (!Number.isNaN(numericCode)) {
      const hexStatusCode = `0x${numericCode.toString(16).padStart(4, '0')}`;
      errorCode = mapLedgerStatusCodeToErrorCode(hexStatusCode);
    }
  }

  const resolvedMessage =
    message && message.length > 0
      ? message
      : (data.userMessage ?? 'Hardware wallet error');

  const hwError = new HardwareWalletError(resolvedMessage, {
    code: errorCode,
    severity: data.severity as Severity,
    category: data.category as Category,
    userMessage: data.userMessage ?? '',
    metadata: {
      ...(data.metadata as Record<string, unknown>),
      walletType,
    },
  });

  if (stack) {
    hwError.stack = stack;
  }

  return hwError;
}

/**
 * Reconstruct a HardwareWalletError from RPC/serialized error shapes.
 *
 * @param error - The error to reconstruct.
 * @param walletType - Wallet type string (e.g. "ledger", "trezor").
 * @returns A normalized HardwareWalletError instance.
 */
export function toHardwareWalletError(
  error: unknown,
  walletType: HardwareWalletType,
): HardwareWalletError {
  if (error instanceof HardwareWalletError) {
    return error;
  }

  if (error instanceof KeyringControllerError) {
    const errorCode = error?.code
      ? mapStringCodeToErrorCode(error.code)
      : ErrorCode.Unknown;

    return createHardwareWalletError(errorCode, walletType, error.message, {
      cause: error?.cause,
    });
  }

  if (isSerializedRpcHardwareWalletError(error)) {
    return convertSerializedCauseToHardwareWalletError(
      error.data.cause,
      walletType,
      error.data,
    );
  }

  if (isJsonRpcHardwareWalletError(error)) {
    return convertDataToHardwareWalletError(
      error.data,
      error.message ?? '',
      walletType,
      error.stack,
    );
  }

  if (walletType === 'ledger') {
    const errorMessage = getErrorMessage(error);
    const hexStatusCode = extractHexStatusCodeFromMessage(errorMessage);

    if (hexStatusCode) {
      const errorCode = mapLedgerStatusCodeToErrorCode(hexStatusCode);
      return createHardwareWalletError(errorCode, walletType, errorMessage, {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  const fallbackMessage = getErrorMessage(error);
  return createHardwareWalletError(
    ErrorCode.Unknown,
    walletType,
    fallbackMessage,
  );
}
