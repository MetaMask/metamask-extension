import { selectIsTokenSecurityTrustEnabled } from './feature-flags';

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
