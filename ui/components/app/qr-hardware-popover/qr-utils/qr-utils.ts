import { QrErrorType } from '../qr-error-content';
import { extractMessageFromUnknownError } from '../../../../contexts/hardware-wallets';

/**
 * Error categories for QR scan results.
 *
 * - `NonUrQrScanned` - scanned data is not UR-encoded (URL, plain address, etc.).
 * - `WrongUrType` - valid UR whose type does not match the current flow.
 * - `UrDecodeError` - the UR decoder failed to reassemble frames.
 * - `ScanException` - an unexpected runtime exception during processing.
 */
export const ScanErrorCategory = {
  NonUrQrScanned: 'non_ur_qr_scanned',
  WrongUrType: 'wrong_ur_type',
  UrDecodeError: 'ur_decode_error',
  ScanException: 'scan_exception',
} as const;

export type ScanErrorCategory =
  (typeof ScanErrorCategory)[keyof typeof ScanErrorCategory];

/**
 * Discriminated union describing a classified scan error.
 * Each variant carries only the metadata relevant to its category.
 */
export type ScanErrorClassification =
  | { category: typeof ScanErrorCategory.NonUrQrScanned; isUrFormat: false }
  | {
      category: typeof ScanErrorCategory.WrongUrType;
      isUrFormat: true;
      receivedUrType: string;
    }
  | { category: typeof ScanErrorCategory.UrDecodeError; isUrFormat: true }
  | {
      category: typeof ScanErrorCategory.ScanException;
      isUrFormat: boolean;
      rawMessage: string;
    };

/**
 * Input for {@link classifyScanResult}. Callers populate only the fields
 * relevant to the point where the error was detected.
 */
export type ScanClassificationInput = {
  text?: string;
  decodedType?: string;
  expectedTypes: readonly string[];
  decoderError?: boolean;
  exception?: unknown;
};

const UR_PREFIX = 'ur:';

/**
 * Checks whether text starts with the case-insensitive `ur:` prefix.
 *
 * @param text - Raw scanned QR text.
 * @returns True if the text looks like a UR-encoded payload.
 */
function looksLikeUr(text: string): boolean {
  return text.toLowerCase().startsWith(UR_PREFIX);
}

/**
 * Classifies a QR scan result into one of four error categories.
 *
 * Priority (highest to lowest):
 * 1. Runtime exception (`exception` is set).
 * 2. Decoder error (`decoderError` is true).
 * 3. Wrong UR type (`decodedType` not in `expectedTypes`).
 * 4. Non-UR content (`text` does not start with `ur:`).
 *
 * Returns `null` when no error is detected.
 *
 * @param input - Scan context fields.
 * @returns A classification result or `null`.
 */
export function classifyScanResult(
  input: ScanClassificationInput,
): ScanErrorClassification | null {
  const { text, decodedType, expectedTypes, decoderError, exception } = input;

  if (exception !== undefined && exception !== null) {
    const isUrFormat = text === undefined ? false : looksLikeUr(text);

    // The scanned text is clearly not UR-encoded (e.g. a plain address or URL).
    // The exception is merely a side-effect of feeding non-UR data into the
    // decoder, so the root cause is "wrong QR type" rather than a decode failure.
    if (!isUrFormat && text !== undefined && text.length > 0) {
      return { category: ScanErrorCategory.NonUrQrScanned, isUrFormat: false };
    }

    return {
      category: ScanErrorCategory.ScanException,
      isUrFormat,
      rawMessage: extractMessageFromUnknownError(exception),
    };
  }

  if (decoderError === true) {
    return { category: ScanErrorCategory.UrDecodeError, isUrFormat: true };
  }

  if (decodedType !== undefined) {
    const normalizedDecoded = decodedType.toLowerCase();
    const isExpected = expectedTypes.some(
      (t) => t.toLowerCase() === normalizedDecoded,
    );
    if (!isExpected) {
      return {
        category: ScanErrorCategory.WrongUrType,
        isUrFormat: true,
        receivedUrType: decodedType,
      };
    }
    return null;
  }

  if (text !== undefined && text.length > 0 && !looksLikeUr(text)) {
    return { category: ScanErrorCategory.NonUrQrScanned, isUrFormat: false };
  }

  return null;
}

/**
 * Maps a {@link ScanErrorCategory} to the {@link QrErrorType} used by the
 * error-content UI. `scan_exception` maps to `UrDecodeError` because the
 * UI uses the same generic messaging for runtime failures.
 *
 * @param category - The classified scan error category.
 * @returns The corresponding QrErrorType value.
 */
export function scanCategoryToQrErrorType(
  category: ScanErrorCategory,
): QrErrorType {
  switch (category) {
    case ScanErrorCategory.NonUrQrScanned:
      return QrErrorType.NonUrQrCode;
    case ScanErrorCategory.WrongUrType:
      return QrErrorType.WrongUrType;
    case ScanErrorCategory.UrDecodeError:
    case ScanErrorCategory.ScanException:
      return QrErrorType.UrDecodeError;
    default:
      return QrErrorType.UrDecodeError;
  }
}
