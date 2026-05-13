import { tEn } from '../../../../../test/lib/i18n-helpers';
import { QrErrorType, QrErrorFlowContext } from './qr-error-content.types';
import { resolveErrorCopy, rootTestId } from './qr-error-content.utils';

describe('qr-error-content utils', () => {
  describe('resolveErrorCopy', () => {
    describe('NonUrQrCode', () => {
      it('returns pairing title and body when flow is Pairing', () => {
        const result = resolveErrorCopy(
          QrErrorType.NonUrQrCode,
          QrErrorFlowContext.Pairing,
          tEn,
        );

        expect(result.title).toBe(tEn('qrErrorNonUrPairingTitle'));
        expect(result.body).toBe(tEn('qrErrorNonUrPairingBody'));
      });

      it('returns signing title and body when flow is Signing', () => {
        const result = resolveErrorCopy(
          QrErrorType.NonUrQrCode,
          QrErrorFlowContext.Signing,
          tEn,
        );

        expect(result.title).toBe(tEn('qrErrorNonUrSigningTitle'));
        expect(result.body).toBe(tEn('qrErrorNonUrSigningBody'));
      });
    });

    describe('WrongUrType', () => {
      it('returns pairing title and body when flow is Pairing', () => {
        const result = resolveErrorCopy(
          QrErrorType.WrongUrType,
          QrErrorFlowContext.Pairing,
          tEn,
        );

        expect(result.title).toBe(tEn('qrErrorWrongUrTypePairingTitle'));
        expect(result.body).toBe(tEn('qrErrorWrongUrTypePairingBody'));
      });

      it('returns signing title and body when flow is Signing', () => {
        const result = resolveErrorCopy(
          QrErrorType.WrongUrType,
          QrErrorFlowContext.Signing,
          tEn,
        );

        expect(result.title).toBe(tEn('qrErrorWrongUrTypeSigningTitle'));
        expect(result.body).toBe(tEn('qrErrorWrongUrTypeSigningBody'));
      });
    });

    describe('UrDecodeError', () => {
      it('returns universal title and body regardless of flow context', () => {
        const pairing = resolveErrorCopy(
          QrErrorType.UrDecodeError,
          QrErrorFlowContext.Pairing,
          tEn,
        );
        const signing = resolveErrorCopy(
          QrErrorType.UrDecodeError,
          QrErrorFlowContext.Signing,
          tEn,
        );

        expect(pairing.title).toBe(tEn('qrErrorUrDecodeTitle'));
        expect(pairing.body).toBe(tEn('qrErrorUrDecodeBody'));
        expect(signing).toStrictEqual(pairing);
      });
    });

    describe('default fallback', () => {
      it('falls back to UR decode copy for unrecognised error types', () => {
        const result = resolveErrorCopy(
          'unknownType' as QrErrorType,
          QrErrorFlowContext.Pairing,
          tEn,
        );

        expect(result.title).toBe(tEn('qrErrorUrDecodeTitle'));
        expect(result.body).toBe(tEn('qrErrorUrDecodeBody'));
      });
    });
  });

  describe('rootTestId', () => {
    it('produces the expected test-id for each error + flow combination', () => {
      expect(
        rootTestId(QrErrorType.NonUrQrCode, QrErrorFlowContext.Pairing),
      ).toBe('qr-error-nonUrQrCode-pairing');

      expect(
        rootTestId(QrErrorType.NonUrQrCode, QrErrorFlowContext.Signing),
      ).toBe('qr-error-nonUrQrCode-signing');

      expect(
        rootTestId(QrErrorType.WrongUrType, QrErrorFlowContext.Pairing),
      ).toBe('qr-error-wrongUrType-pairing');

      expect(
        rootTestId(QrErrorType.WrongUrType, QrErrorFlowContext.Signing),
      ).toBe('qr-error-wrongUrType-signing');

      expect(
        rootTestId(QrErrorType.UrDecodeError, QrErrorFlowContext.Pairing),
      ).toBe('qr-error-urDecodeError-pairing');

      expect(
        rootTestId(QrErrorType.UrDecodeError, QrErrorFlowContext.Signing),
      ).toBe('qr-error-urDecodeError-signing');
    });
  });
});
