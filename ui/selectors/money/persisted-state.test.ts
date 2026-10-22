import type { MetaMaskReduxState } from '../../store/store';
import { selectMoneyEarnBannerDismissedTokenKeys } from './persisted-state';

const buildState = (moneyEarnBannerDismissedTokenKeys?: string[]) =>
  ({
    metamask: { moneyEarnBannerDismissedTokenKeys },
  }) as unknown as MetaMaskReduxState;

describe('selectMoneyEarnBannerDismissedTokenKeys', () => {
  it('returns the dismissed token keys', () => {
    const keys = ['0x1:0xabc', '0xe708:0xdef'];

    expect(selectMoneyEarnBannerDismissedTokenKeys(buildState(keys))).toBe(
      keys,
    );
  });

  it('returns a stable empty array when the state is missing', () => {
    expect(selectMoneyEarnBannerDismissedTokenKeys(buildState())).toStrictEqual(
      [],
    );
    expect(selectMoneyEarnBannerDismissedTokenKeys(buildState())).toBe(
      selectMoneyEarnBannerDismissedTokenKeys(buildState()),
    );
  });
});
