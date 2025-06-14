import { TrustSignalState } from '../../../../hooks/useTrustSignals';
import { getInitialNameValue } from './trust-signal-config';

describe('trust-signal-config', () => {
  describe('getInitialNameValue', () => {
    it('should return saved petname when available', () => {
      const result = getInitialNameValue(
        'My Saved Name',
        TrustSignalState.Malicious,
        'Malicious',
        true,
      );
      expect(result).toBe('My Saved Name');
    });

    it('should return empty string for malicious addresses when no petname', () => {
      const result = getInitialNameValue(
        null,
        TrustSignalState.Malicious,
        'Malicious',
        true,
      );
      expect(result).toBe('');
    });

    it('should return empty string for non-malicious addresses when no petname', () => {
      const result = getInitialNameValue(
        null,
        TrustSignalState.Warning,
        'Warning Label',
        true,
      );
      expect(result).toBe('');
    });

    it('should return empty string when trust signals are disabled', () => {
      const result = getInitialNameValue(
        null,
        TrustSignalState.Malicious,
        'Malicious',
        false,
      );
      expect(result).toBe('');
    });

    it('should return empty string when no trust signal label available', () => {
      const result = getInitialNameValue(
        null,
        TrustSignalState.Malicious,
        undefined,
        true,
      );
      expect(result).toBe('');
    });
  });
});
