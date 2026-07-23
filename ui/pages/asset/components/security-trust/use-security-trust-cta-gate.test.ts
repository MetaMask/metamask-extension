import { getResultTypeConfig } from '../../utils/security-utils';
import { getSecurityTrustCtaSheetParams, shouldGateSecurityTrustCta } from './use-security-trust-cta-gate';
import { getSecurityTrustInfoSheetParams } from './use-security-trust-info-sheet';

const t = (key: string, substitutions?: string[]) =>
  substitutions?.length ? `${key}:${substitutions.join(',')}` : key;

const mockSecurityData = {
  resultType: 'Malicious' as const,
  features: [{ featureId: 'KNOWN_MALICIOUS', type: 'Malicious' as const, description: '' }],
  fees: null,
  financialStats: null,
  metadata: null,
  created: '2020-01-01T00:00:00.000Z',
};

describe('use-security-trust-cta-gate', () => {
  it('gates warning, spam, and malicious result types', () => {
    expect(shouldGateSecurityTrustCta('Malicious')).toBe(true);
    expect(shouldGateSecurityTrustCta('Warning')).toBe(true);
    expect(shouldGateSecurityTrustCta('Spam')).toBe(true);
    expect(shouldGateSecurityTrustCta('Verified')).toBe(false);
    expect(shouldGateSecurityTrustCta('Benign')).toBe(false);
  });

  it('builds CTA sheet params with onProceed', () => {
    const config = getResultTypeConfig('Malicious', t);
    const onProceed = jest.fn();
    const params = getSecurityTrustCtaSheetParams(
      mockSecurityData,
      config,
      'SWOL',
      onProceed,
      'buy',
    );

    expect(params?.source).toBe('buy');
    expect(params?.onProceed).toBe(onProceed);
    expect(params?.title).toBe('securityTrustMaliciousTokenTitle');
  });
});

describe('use-security-trust-info-sheet', () => {
  it('builds verified info sheet params', () => {
    const config = getResultTypeConfig('Verified', t);
    const params = getSecurityTrustInfoSheetParams(
      { ...mockSecurityData, resultType: 'Verified', features: [] },
      config,
      'USDC',
    );

    expect(params?.severity).toBe('Verified');
    expect(params?.source).toBe('badge');
    expect(params?.onProceed).toBeUndefined();
    expect(params?.description).toContain('USDC');
  });

  it('returns null for benign tokens', () => {
    const config = getResultTypeConfig('Benign', t);
    const params = getSecurityTrustInfoSheetParams(
      { ...mockSecurityData, resultType: 'Benign', features: [] },
      config,
      'TOKEN',
    );

    expect(params).toBeNull();
  });
});
