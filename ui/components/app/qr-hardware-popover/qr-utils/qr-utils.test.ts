import { QrErrorType } from '../qr-error-content';
import {
  classifyScanResult,
  scanCategoryToQrErrorType,
  type ClassifyScanInput,
  type ScanClassification,
} from './qr-utils';

describe('classifyScanResult', () => {
  const PAIRING_EXPECTED_TYPES = ['crypto-hdkey', 'crypto-account'] as const;
  const SIGNING_EXPECTED_TYPES = ['eth-signature'] as const;

  describe('non_ur_qr_scanned - text is not UR-encoded', () => {
    it('classifies a URL as non-UR', () => {
      expect(
        classifyScanResult({
          text: 'https://metamask.io',
          expectedTypes: PAIRING_EXPECTED_TYPES,
        }),
      ).toStrictEqual({ category: 'non_ur_qr_scanned', isUrFormat: false });
    });

    it('classifies an Ethereum address as non-UR', () => {
      expect(
        classifyScanResult({
          text: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28',
          expectedTypes: PAIRING_EXPECTED_TYPES,
        }),
      ).toStrictEqual({ category: 'non_ur_qr_scanned', isUrFormat: false });
    });

    it('classifies arbitrary text as non-UR', () => {
      expect(
        classifyScanResult({
          text: 'Hello World!',
          expectedTypes: PAIRING_EXPECTED_TYPES,
        }),
      ).toStrictEqual({ category: 'non_ur_qr_scanned', isUrFormat: false });
    });

    it('classifies numeric string as non-UR', () => {
      expect(
        classifyScanResult({
          text: '1234567890',
          expectedTypes: PAIRING_EXPECTED_TYPES,
        }),
      ).toStrictEqual({ category: 'non_ur_qr_scanned', isUrFormat: false });
    });

    it('returns null for empty text', () => {
      expect(
        classifyScanResult({
          text: '',
          expectedTypes: PAIRING_EXPECTED_TYPES,
        }),
      ).toBeNull();
    });
  });

  describe('wrong_ur_type - valid UR with unexpected type', () => {
    it('detects crypto-hdkey during a signing flow', () => {
      const result = classifyScanResult({
        decodedType: 'crypto-hdkey',
        expectedTypes: SIGNING_EXPECTED_TYPES,
      });

      expect(result).toStrictEqual({
        category: 'wrong_ur_type',
        isUrFormat: true,
        receivedUrType: 'crypto-hdkey',
      });
    });

    it('detects eth-signature during a pairing flow', () => {
      const result = classifyScanResult({
        decodedType: 'eth-signature',
        expectedTypes: PAIRING_EXPECTED_TYPES,
      });

      expect(result).toStrictEqual({
        category: 'wrong_ur_type',
        isUrFormat: true,
        receivedUrType: 'eth-signature',
      });
    });

    it('treats any type not in expectedTypes as wrong', () => {
      const result = classifyScanResult({
        decodedType: 'crypto-psbt',
        expectedTypes: [...PAIRING_EXPECTED_TYPES, ...SIGNING_EXPECTED_TYPES],
      });

      expect(result).toStrictEqual({
        category: 'wrong_ur_type',
        isUrFormat: true,
        receivedUrType: 'crypto-psbt',
      });
    });

    it('compares types case-insensitively', () => {
      expect(
        classifyScanResult({
          decodedType: 'CRYPTO-HDKEY',
          expectedTypes: ['crypto-hdkey'],
        }),
      ).toBeNull();

      expect(
        classifyScanResult({
          decodedType: 'crypto-hdkey',
          expectedTypes: ['CRYPTO-HDKEY'],
        }),
      ).toBeNull();
    });

    it('preserves original casing in receivedUrType', () => {
      const result = classifyScanResult({
        decodedType: 'Eth-Signature',
        expectedTypes: PAIRING_EXPECTED_TYPES,
      });

      expect(result).toStrictEqual(
        expect.objectContaining({ receivedUrType: 'Eth-Signature' }),
      );
    });

    it('reports wrong type when expectedTypes is empty', () => {
      const result = classifyScanResult({
        decodedType: 'crypto-hdkey',
        expectedTypes: [],
      });

      expect(result).toStrictEqual({
        category: 'wrong_ur_type',
        isUrFormat: true,
        receivedUrType: 'crypto-hdkey',
      });
    });
  });

  describe('ur_decode_error - decoder failed to reassemble', () => {
    it('classifies when decoderError is true', () => {
      const result = classifyScanResult({
        decoderError: true,
        expectedTypes: PAIRING_EXPECTED_TYPES,
      });

      expect(result).toStrictEqual({
        category: 'ur_decode_error',
        isUrFormat: true,
      });
    });

    it('classifies even when UR text is also present', () => {
      const result = classifyScanResult({
        text: 'ur:crypto-hdkey/1-3/partial-data',
        decoderError: true,
        expectedTypes: PAIRING_EXPECTED_TYPES,
      });

      expect(result).toStrictEqual({
        category: 'ur_decode_error',
        isUrFormat: true,
      });
    });

    it('does not classify when decoderError is false', () => {
      const result = classifyScanResult({
        text: 'ur:crypto-hdkey/1-3/some-data',
        decoderError: false,
        expectedTypes: PAIRING_EXPECTED_TYPES,
      });

      expect(result).toBeNull();
    });
  });

  describe('scan_exception - runtime exception caught', () => {
    it('extracts message from an Error instance', () => {
      const result = classifyScanResult({
        expectedTypes: PAIRING_EXPECTED_TYPES,
        exception: new Error('CBOR decode failed'),
      });

      expect(result).toStrictEqual({
        category: 'scan_exception',
        isUrFormat: false,
        rawMessage: 'CBOR decode failed',
      });
    });

    it('uses string exceptions directly as rawMessage', () => {
      const result = classifyScanResult({
        expectedTypes: PAIRING_EXPECTED_TYPES,
        exception: 'something went wrong',
      });

      expect(result).toStrictEqual({
        category: 'scan_exception',
        isUrFormat: false,
        rawMessage: 'something went wrong',
      });
    });

    it('stringifies non-Error non-string exceptions', () => {
      const result = classifyScanResult({
        expectedTypes: PAIRING_EXPECTED_TYPES,
        exception: 42,
      });

      expect(result).toStrictEqual({
        category: 'scan_exception',
        isUrFormat: false,
        rawMessage: '42',
      });
    });

    it('treats null as a present exception value', () => {
      const result = classifyScanResult({
        text: 'ur:crypto-hdkey/data',
        expectedTypes: PAIRING_EXPECTED_TYPES,
        exception: null,
      });

      expect(result).toStrictEqual({
        category: 'scan_exception',
        isUrFormat: true,
        rawMessage: 'null',
      });
    });

    it('infers isUrFormat from text when exception is present', () => {
      const withUrText = classifyScanResult({
        text: 'ur:crypto-hdkey/1-2/bad-payload',
        expectedTypes: PAIRING_EXPECTED_TYPES,
        exception: new Error('fail'),
      });
      expect(withUrText).toStrictEqual(
        expect.objectContaining({ isUrFormat: true }),
      );

      const withNonUrText = classifyScanResult({
        text: 'https://example.com',
        expectedTypes: PAIRING_EXPECTED_TYPES,
        exception: new Error('fail'),
      });
      expect(withNonUrText).toStrictEqual(
        expect.objectContaining({ isUrFormat: false }),
      );
    });

    it('defaults isUrFormat to false when text is absent', () => {
      const result = classifyScanResult({
        expectedTypes: SIGNING_EXPECTED_TYPES,
        exception: new Error('timeout'),
      });

      expect(result).toStrictEqual(
        expect.objectContaining({ isUrFormat: false }),
      );
    });

    it('handles an Error with empty message', () => {
      const result = classifyScanResult({
        expectedTypes: PAIRING_EXPECTED_TYPES,
        exception: new Error(''),
      });

      expect(result).toStrictEqual(expect.objectContaining({ rawMessage: '' }));
    });
  });

  describe('priority ordering', () => {
    it('exception > decoderError', () => {
      const result = classifyScanResult({
        text: 'ur:crypto-hdkey/1-2/data',
        decoderError: true,
        expectedTypes: PAIRING_EXPECTED_TYPES,
        exception: new Error('runtime crash'),
      });

      expect(result?.category).toBe('scan_exception');
    });

    it('exception > wrong UR type', () => {
      const result = classifyScanResult({
        decodedType: 'crypto-psbt',
        expectedTypes: PAIRING_EXPECTED_TYPES,
        exception: new Error('processing error'),
      });

      expect(result?.category).toBe('scan_exception');
    });

    it('decoderError > wrong UR type', () => {
      const result = classifyScanResult({
        decodedType: 'crypto-psbt',
        decoderError: true,
        expectedTypes: PAIRING_EXPECTED_TYPES,
      });

      expect(result?.category).toBe('ur_decode_error');
    });

    it('decoderError > non-UR text', () => {
      const result = classifyScanResult({
        text: 'https://example.com',
        decoderError: true,
        expectedTypes: PAIRING_EXPECTED_TYPES,
      });

      expect(result?.category).toBe('ur_decode_error');
    });

    it('wrong UR type > non-UR text', () => {
      const result = classifyScanResult({
        text: 'https://example.com',
        decodedType: 'crypto-psbt',
        expectedTypes: PAIRING_EXPECTED_TYPES,
      });

      expect(result?.category).toBe('wrong_ur_type');
    });
  });

  describe('returns null (no error detected)', () => {
    it('when decoded type matches an expected type', () => {
      expect(
        classifyScanResult({
          decodedType: 'crypto-hdkey',
          expectedTypes: PAIRING_EXPECTED_TYPES,
        }),
      ).toBeNull();
    });

    it('when text looks like a UR still being decoded', () => {
      expect(
        classifyScanResult({
          text: 'ur:crypto-hdkey/1-5/some-encoded-data',
          expectedTypes: PAIRING_EXPECTED_TYPES,
        }),
      ).toBeNull();
    });

    it('when only expectedTypes is provided (scanner idle)', () => {
      expect(
        classifyScanResult({ expectedTypes: PAIRING_EXPECTED_TYPES }),
      ).toBeNull();
    });

    it('for case-variant UR prefixes (UR:, Ur:)', () => {
      expect(
        classifyScanResult({
          text: 'UR:CRYPTO-HDKEY/1-2/DATA',
          expectedTypes: PAIRING_EXPECTED_TYPES,
        }),
      ).toBeNull();

      expect(
        classifyScanResult({
          text: 'Ur:Crypto-Hdkey/1-2/data',
          expectedTypes: PAIRING_EXPECTED_TYPES,
        }),
      ).toBeNull();
    });

    it('for bare ur: prefix with no type segment', () => {
      expect(
        classifyScanResult({
          text: 'ur:',
          expectedTypes: PAIRING_EXPECTED_TYPES,
        }),
      ).toBeNull();
    });

    it('when exception is explicitly undefined', () => {
      const input: ClassifyScanInput = {
        text: 'ur:crypto-hdkey/1-2/data',
        expectedTypes: PAIRING_EXPECTED_TYPES,
        exception: undefined,
      };

      expect(classifyScanResult(input)).toBeNull();
    });
  });

  describe('end-to-end acceptance scenarios', () => {
    it('A4: AirGap V3 format scanned during pairing results in wrong_ur_type', () => {
      const result = classifyScanResult({
        decodedType: 'crypto-multi-accounts',
        expectedTypes: PAIRING_EXPECTED_TYPES,
      });

      expect(result).toStrictEqual({
        category: 'wrong_ur_type',
        isUrFormat: true,
        receivedUrType: 'crypto-multi-accounts',
      });
    });

    it('A9: partially obscured QR results in ur_decode_error', () => {
      const result = classifyScanResult({
        text: 'ur:crypto-hdkey/1-5/partial',
        decoderError: true,
        expectedTypes: PAIRING_EXPECTED_TYPES,
      });

      expect(result).toStrictEqual({
        category: 'ur_decode_error',
        isUrFormat: true,
      });
    });

    it('A11-A13: successful pairing and signing returns null', () => {
      expect(
        classifyScanResult({
          decodedType: 'crypto-hdkey',
          expectedTypes: PAIRING_EXPECTED_TYPES,
        }),
      ).toBeNull();

      expect(
        classifyScanResult({
          decodedType: 'eth-signature',
          expectedTypes: SIGNING_EXPECTED_TYPES,
        }),
      ).toBeNull();
    });
  });
});

describe('scanCategoryToQrErrorType', () => {
  it('maps non_ur_qr_scanned to NonUrQrCode', () => {
    expect(scanCategoryToQrErrorType('non_ur_qr_scanned')).toBe(
      QrErrorType.NonUrQrCode,
    );
  });

  it('maps wrong_ur_type to WrongUrType', () => {
    expect(scanCategoryToQrErrorType('wrong_ur_type')).toBe(
      QrErrorType.WrongUrType,
    );
  });

  it('maps ur_decode_error to UrDecodeError', () => {
    expect(scanCategoryToQrErrorType('ur_decode_error')).toBe(
      QrErrorType.UrDecodeError,
    );
  });

  it('maps scan_exception to UrDecodeError', () => {
    expect(scanCategoryToQrErrorType('scan_exception')).toBe(
      QrErrorType.UrDecodeError,
    );
  });

  it('falls back to UrDecodeError for unknown categories', () => {
    const unknownCategory = 'future_category' as never;
    expect(scanCategoryToQrErrorType(unknownCategory)).toBe(
      QrErrorType.UrDecodeError,
    );
  });
});

describe('ScanClassification type discrimination', () => {
  it('narrows non_ur_qr_scanned to { isUrFormat: false }', () => {
    const result = classifyScanResult({
      text: 'plain text',
      expectedTypes: ['crypto-hdkey'],
    }) as ScanClassification;

    expect(result.category).toBe('non_ur_qr_scanned');
    expect(result.isUrFormat).toBe(false);
  });

  it('narrows wrong_ur_type to { isUrFormat: true, receivedUrType }', () => {
    const result = classifyScanResult({
      decodedType: 'crypto-psbt',
      expectedTypes: ['crypto-hdkey'],
    }) as ScanClassification;

    expect(result.category).toBe('wrong_ur_type');
    if (result.category === 'wrong_ur_type') {
      expect(result.isUrFormat).toBe(true);
      expect(result.receivedUrType).toBe('crypto-psbt');
    }
  });

  it('narrows scan_exception to { isUrFormat, rawMessage }', () => {
    const result = classifyScanResult({
      expectedTypes: ['crypto-hdkey'],
      exception: new Error('crash'),
    }) as ScanClassification;

    expect(result.category).toBe('scan_exception');
    if (result.category === 'scan_exception') {
      expect(result.rawMessage).toBe('crash');
      expect(typeof result.isUrFormat).toBe('boolean');
    }
  });
});
