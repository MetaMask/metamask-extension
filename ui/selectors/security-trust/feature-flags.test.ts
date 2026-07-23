import { selectIsTokenSecurityTrustEnabled } from './feature-flags';

jest.mock('./constants', () => ({
  IS_TOKEN_SECURITY_TRUST_UI_ENABLED: true,
}));

describe('selectIsTokenSecurityTrustEnabled', () => {
  it('returns true when external services are enabled', () => {
    expect(
      selectIsTokenSecurityTrustEnabled({
        metamask: { useExternalServices: true },
      } as never),
    ).toBe(true);
  });

  it('returns false when external services are disabled', () => {
    expect(
      selectIsTokenSecurityTrustEnabled({
        metamask: { useExternalServices: false },
      } as never),
    ).toBe(false);
  });
});
