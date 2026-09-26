import { isAssetsUnifyStateTracesEnabled } from './remote-feature-flag';

// The global jest setup may mock this module; unmock it so we test the real
// implementation.
jest.unmock('./remote-feature-flag');

describe('isAssetsUnifyStateTracesEnabled', () => {
  it('returns false when featureFlag is undefined', () => {
    expect(isAssetsUnifyStateTracesEnabled(undefined)).toBe(false);
  });

  it('returns false when featureFlag is null', () => {
    expect(isAssetsUnifyStateTracesEnabled(null)).toBe(false);
  });

  it('returns false when tracesEnabled is absent', () => {
    expect(isAssetsUnifyStateTracesEnabled({})).toBe(false);
  });

  it('returns false when tracesEnabled is false', () => {
    expect(isAssetsUnifyStateTracesEnabled({ tracesEnabled: false })).toBe(
      false,
    );
  });

  it('returns true when tracesEnabled is true', () => {
    expect(isAssetsUnifyStateTracesEnabled({ tracesEnabled: true })).toBe(true);
  });
});
