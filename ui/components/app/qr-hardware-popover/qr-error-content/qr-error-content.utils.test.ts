import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { QrErrorType, QrErrorFlowContext } from './qr-error-content.types';
import { resolveErrorCopy, rootTestId } from './qr-error-content.utils';

const mockT = jest.fn((key: string) => `[${key}]`);

describe('qr-error-content utils', () => {
  describe('resolveErrorCopy', () => {
    beforeEach(() => {
      mockT.mockClear();
    });

    it('returns pairing title and body for NonUrQrCode + Pairing', () => {
      resolveErrorCopy(
        QrErrorType.NonUrQrCode,
        QrErrorFlowContext.Pairing,
        mockT,
      );

      expect(mockT).toHaveBeenCalledWith('qrErrorNonUrPairingTitle');
      expect(mockT).toHaveBeenCalledWith('qrErrorNonUrPairingBody');
    });

    it('returns signing title and body for NonUrQrCode + Signing', () => {
      resolveErrorCopy(
        QrErrorType.NonUrQrCode,
        QrErrorFlowContext.Signing,
        mockT,
      );

      expect(mockT).toHaveBeenCalledWith('qrErrorNonUrSigningTitle');
      expect(mockT).toHaveBeenCalledWith('qrErrorNonUrSigningBody');
    });

    it('returns pairing title and body for WrongUrType + Pairing', () => {
      resolveErrorCopy(
        QrErrorType.WrongUrType,
        QrErrorFlowContext.Pairing,
        mockT,
      );

      expect(mockT).toHaveBeenCalledWith('qrErrorWrongUrTypePairingTitle');
      expect(mockT).toHaveBeenCalledWith('qrErrorWrongUrTypePairingBody');
    });

    it('returns signing title and body for WrongUrType + Signing', () => {
      resolveErrorCopy(
        QrErrorType.WrongUrType,
        QrErrorFlowContext.Signing,
        mockT,
      );

      expect(mockT).toHaveBeenCalledWith('qrErrorWrongUrTypeSigningTitle');
      expect(mockT).toHaveBeenCalledWith('qrErrorWrongUrTypeSigningBody');
    });

    it('returns universal title and body for UrDecodeError + Pairing', () => {
      resolveErrorCopy(
        QrErrorType.UrDecodeError,
        QrErrorFlowContext.Pairing,
        mockT,
      );

      expect(mockT).toHaveBeenCalledWith('qrErrorUrDecodeTitle');
      expect(mockT).toHaveBeenCalledWith('qrErrorUrDecodeBody');
    });

    it('returns the same universal copy for UrDecodeError + Signing', () => {
      resolveErrorCopy(
        QrErrorType.UrDecodeError,
        QrErrorFlowContext.Signing,
        mockT,
      );

      expect(mockT).toHaveBeenCalledWith('qrErrorUrDecodeTitle');
      expect(mockT).toHaveBeenCalledWith('qrErrorUrDecodeBody');
    });

    it('falls back to UR decode copy for unrecognised error types', () => {
      resolveErrorCopy(
        'unknownType' as QrErrorType,
        QrErrorFlowContext.Pairing,
        mockT,
      );

      expect(mockT).toHaveBeenCalledWith('qrErrorUrDecodeTitle');
      expect(mockT).toHaveBeenCalledWith('qrErrorUrDecodeBody');
    });

    it('returns an object with title and body string properties', () => {
      const result = resolveErrorCopy(
        QrErrorType.NonUrQrCode,
        QrErrorFlowContext.Pairing,
        mockT,
      );

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('body');
      expect(typeof result.title).toBe('string');
      expect(typeof result.body).toBe('string');
    });

    it('passes the correct locale keys that exist in the messages bundle', () => {
      const keysUsed: string[] = [];
      const capturingT = jest.fn((key: string) => {
        keysUsed.push(key);
        return `[${key}]`;
      });

      const allTypes = [
        QrErrorType.NonUrQrCode,
        QrErrorType.WrongUrType,
        QrErrorType.UrDecodeError,
      ];
      const allFlows = [QrErrorFlowContext.Pairing, QrErrorFlowContext.Signing];

      for (const errorType of allTypes) {
        for (const flow of allFlows) {
          resolveErrorCopy(errorType, flow, capturingT);
        }
      }

      for (const key of keysUsed) {
        expect(messages).toHaveProperty(key);
      }
    });
  });

  describe('rootTestId', () => {
    it('concatenates error type and flow context with the qr-error prefix', () => {
      expect(
        rootTestId(QrErrorType.NonUrQrCode, QrErrorFlowContext.Pairing),
      ).toBe('qr-error-nonUrQrCode-pairing');
    });

    it('reflects the signing flow context', () => {
      expect(
        rootTestId(QrErrorType.NonUrQrCode, QrErrorFlowContext.Signing),
      ).toBe('qr-error-nonUrQrCode-signing');
    });

    it('reflects the WrongUrType error type', () => {
      expect(
        rootTestId(QrErrorType.WrongUrType, QrErrorFlowContext.Pairing),
      ).toBe('qr-error-wrongUrType-pairing');
    });

    it('reflects the UrDecodeError error type', () => {
      expect(
        rootTestId(QrErrorType.UrDecodeError, QrErrorFlowContext.Signing),
      ).toBe('qr-error-urDecodeError-signing');
    });
  });
});
