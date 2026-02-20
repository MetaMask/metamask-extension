import {
  selectMusdConversionEducationSeen,
  selectMusdConversionDismissedCtaKeys,
} from './persisted-state';

type MockState = {
  metamask: {
    musdConversionEducationSeen?: boolean;
    musdConversionDismissedCtaKeys?: string[];
  };
};

const getMockState = (
  overrides: Partial<MockState['metamask']> = {},
): MockState => ({
  metamask: {
    ...overrides,
  },
});

describe('MUSD Persisted State Selectors', () => {
  describe('selectMusdConversionEducationSeen', () => {
    it('returns true when education has been seen', () => {
      const state = getMockState({ musdConversionEducationSeen: true });
      expect(selectMusdConversionEducationSeen(state as never)).toBe(true);
    });

    it('returns false when education has not been seen', () => {
      const state = getMockState({ musdConversionEducationSeen: false });
      expect(selectMusdConversionEducationSeen(state as never)).toBe(false);
    });

    it('defaults to false when the property is undefined', () => {
      const state = getMockState();
      expect(selectMusdConversionEducationSeen(state as never)).toBe(false);
    });
  });

  describe('selectMusdConversionDismissedCtaKeys', () => {
    it('returns the dismissed CTA keys array', () => {
      const keys = ['0x1-0xabc', '0x1-0xdef'];
      const state = getMockState({ musdConversionDismissedCtaKeys: keys });
      expect(
        selectMusdConversionDismissedCtaKeys(state as never),
      ).toStrictEqual(keys);
    });

    it('returns an empty array when no CTAs have been dismissed', () => {
      const state = getMockState({ musdConversionDismissedCtaKeys: [] });
      expect(
        selectMusdConversionDismissedCtaKeys(state as never),
      ).toStrictEqual([]);
    });

    it('defaults to an empty array when the property is undefined', () => {
      const state = getMockState();
      expect(
        selectMusdConversionDismissedCtaKeys(state as never),
      ).toStrictEqual([]);
    });
  });
});
