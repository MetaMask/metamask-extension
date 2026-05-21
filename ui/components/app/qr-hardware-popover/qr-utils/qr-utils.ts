import { QrErrorType } from '../qr-error-content';

/**
 * Error categories for QR scan results.
 *
 * - `non_ur_qr_scanned` - scanned data is not UR-encoded (URL, plain address, etc.).
 * - `wrong_ur_type` - valid UR whose type does not match the current flow.
 * - `ur_decode_error` - the UR decoder failed to reassemble frames.
 * - `scan_exception` - an unexpected runtime exception during processing.
 */
export type ScanErrorCategory =
  | 'non_ur_qr_scanned'
  | 'wrong_ur_type'
  | 'ur_decode_error'
  | 'scan_exception';

/**
 * Discriminated union describing the classification of a scan result.
 * Each variant carries only the metadata relevant to its category.
 */
export type ScanClassification =
  | { category: 'non_ur_qr_scanned'; isUrFormat: false }
  | { category: 'wrong_ur_type'; isUrFormat: true; receivedUrType: string }
  | { category: 'ur_decode_error'; isUrFormat: true }
  | { category: 'scan_exception'; isUrFormat: boolean; rawMessage: string };

/**
 * Input for {@link classifyScanResult}. Callers populate only the fields
 * relevant to the point where the error was detected.
 */
export type ClassifyScanInput = {
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
 * Extracts a string message from an unknown caught value.
 *
 * @param exception - The caught value.
 * @returns The error message or stringified value.
 */
function extractMessage(exception: unknown): string {
  if (exception instanceof Error) {
    return exception.message;
  }
  if (typeof exception === 'string') {
    return exception;
  }
  return String(exception);
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
  input: ClassifyScanInput,
): ScanClassification | null {
  const { text, decodedType, expectedTypes, decoderError, exception } = input;

  if (exception !== undefined) {
    const isUrFormat = text === undefined ? false : looksLikeUr(text);
    return {
      category: 'scan_exception',
      isUrFormat,
      rawMessage: extractMessage(exception),
    };
  }

  if (decoderError === true) {
    return { category: 'ur_decode_error', isUrFormat: true };
  }

  if (decodedType !== undefined) {
    const normalizedDecoded = decodedType.toLowerCase();
    const isExpected = expectedTypes.some(
      (t) => t.toLowerCase() === normalizedDecoded,
    );
    if (!isExpected) {
      return {
        category: 'wrong_ur_type',
        isUrFormat: true,
        receivedUrType: decodedType,
      };
    }
    return null;
  }

  if (text !== undefined && text.length > 0 && !looksLikeUr(text)) {
    return { category: 'non_ur_qr_scanned', isUrFormat: false };
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
    case 'non_ur_qr_scanned':
      return QrErrorType.NonUrQrCode;
    case 'wrong_ur_type':
      return QrErrorType.WrongUrType;
    case 'ur_decode_error':
    case 'scan_exception':
      return QrErrorType.UrDecodeError;
    default:
      return QrErrorType.UrDecodeError;
  }
}
