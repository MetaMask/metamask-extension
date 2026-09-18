import { getPerpsTabBadgeSeen } from './persisted-state';

type MockState = {
  metamask: {
    perpsTabBadgeSeen?: boolean;
  };
};

const getMockState = (
  overrides: Partial<MockState['metamask']> = {},
): MockState => ({
  metamask: {
    ...overrides,
  },
});

describe('Perps Persisted State Selectors', () => {
  describe('getPerpsTabBadgeSeen', () => {
    it('returns true when the badge has been seen', () => {
      const state = getMockState({ perpsTabBadgeSeen: true });
      expect(getPerpsTabBadgeSeen(state as never)).toBe(true);
    });

    it('returns false when the badge has not been seen', () => {
      const state = getMockState({ perpsTabBadgeSeen: false });
      expect(getPerpsTabBadgeSeen(state as never)).toBe(false);
    });

    it('defaults to false when the property is undefined', () => {
      const state = getMockState();
      expect(getPerpsTabBadgeSeen(state as never)).toBe(false);
    });
  });
});
