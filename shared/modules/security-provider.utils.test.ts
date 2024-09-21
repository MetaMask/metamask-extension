import { SECURITY_PROVIDER_MESSAGE_SEVERITY } from '../constants/security-provider';
import { isSuspiciousResponse } from './security-provider.utils';

describe('security-provider util', () => {
  describe('isSuspiciousResponse', () => {
    it('should return false if the response does not exist', () => {
      const result = isSuspiciousResponse(undefined);
      expect(result).toBeFalsy();
    });

    it('should return false when flagAsDangerous exists and is not malicious', () => {
      const result = isSuspiciousResponse({
        flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_MALICIOUS,
      });
      expect(result).toBeFalsy();
    });

    it('should return true when flagAsDangerous exists and is malicious or not safe', () => {
      const result = isSuspiciousResponse({
        flagAsDangerous: SECURITY_PROVIDER_MESSAGE_SEVERITY.NOT_SAFE,
      });
      expect(result).toBeTruthy();
    });

    it('should return true if the response exists but is empty', () => {
      const result = isSuspiciousResponse({});
      expect(result).toBeTruthy();
    });
  });
});
