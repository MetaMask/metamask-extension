import {
  getPerpsTabBadgeSeen,
  selectHyperliquidDepositPromptTxId,
} from './persisted-state';

type MockState = {
  metamask: {
    perpsTabBadgeSeen?: boolean;
    hyperliquidDepositPromptTxId?: string | null;
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

  describe('selectHyperliquidDepositPromptTxId', () => {
    it('returns the transaction ID when set', () => {
      const state = getMockState({
        hyperliquidDepositPromptTxId: 'tx-123',
      });
      expect(selectHyperliquidDepositPromptTxId(state as never)).toBe(
        'tx-123',
      );
    });

    it('returns null when explicitly set to null', () => {
      const state = getMockState({ hyperliquidDepositPromptTxId: null });
      expect(selectHyperliquidDepositPromptTxId(state as never)).toBeNull();
    });

    it('defaults to null when the property is undefined', () => {
      const state = getMockState();
      expect(selectHyperliquidDepositPromptTxId(state as never)).toBeNull();
    });
  });
});
