import mockState from '../../../../test/data/mock-state.json';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { selectShowArcUsageNoticeToast } from './selectors';

const ACCOUNT = '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc';
const NATIVE = '0x0000000000000000000000000000000000000000';
const TOKEN = '0x3600000000000000000000000000000000000000';

const createArcState = ({
  arcUsageNoticeShown = false,
  tokenBalances = {},
}: {
  arcUsageNoticeShown?: boolean;
  tokenBalances?: Record<string, Record<string, Record<string, string>>>;
}) =>
  ({
    metamask: {
      ...mockState.metamask,
      arcUsageNoticeShown,
      tokenBalances,
    },
  }) as unknown as Parameters<typeof selectShowArcUsageNoticeToast>[0];

describe('#selectShowArcUsageNoticeToast', () => {
  it('shows when an account has a non-zero native Arc balance and the notice was never shown', () => {
    expect(
      selectShowArcUsageNoticeToast(
        createArcState({
          tokenBalances: {
            [ACCOUNT]: { [CHAIN_IDS.ARC]: { [NATIVE]: '0xde0b6b3a7640000' } },
          },
        }),
      ),
    ).toBe(true);
  });

  it('does not show when the native Arc balance is zero', () => {
    expect(
      selectShowArcUsageNoticeToast(
        createArcState({
          tokenBalances: {
            [ACCOUNT]: { [CHAIN_IDS.ARC]: { [NATIVE]: '0x0' } },
          },
        }),
      ),
    ).toBe(false);
  });

  it('does not show when Arc has no tracked balances', () => {
    expect(selectShowArcUsageNoticeToast(createArcState({}))).toBe(false);
  });

  it('does not show again once the notice was shown', () => {
    expect(
      selectShowArcUsageNoticeToast(
        createArcState({
          arcUsageNoticeShown: true,
          tokenBalances: {
            [ACCOUNT]: { [CHAIN_IDS.ARC]: { [NATIVE]: '0xde0b6b3a7640000' } },
          },
        }),
      ),
    ).toBe(false);
  });

  it('shows when the native Arc balance is zero but an Arc token balance is not', () => {
    expect(
      selectShowArcUsageNoticeToast(
        createArcState({
          tokenBalances: {
            [ACCOUNT]: {
              [CHAIN_IDS.ARC]: {
                [NATIVE]: '0x0',
                [TOKEN]: '0xde0b6b3a7640000',
              },
            },
          },
        }),
      ),
    ).toBe(true);
  });

  it('does not show when the non-zero token balance is on another chain', () => {
    expect(
      selectShowArcUsageNoticeToast(
        createArcState({
          tokenBalances: {
            [ACCOUNT]: {
              [CHAIN_IDS.MAINNET]: { [TOKEN]: '0xde0b6b3a7640000' },
            },
          },
        }),
      ),
    ).toBe(false);
  });

  it('does not show when the Arc token balance is zero', () => {
    expect(
      selectShowArcUsageNoticeToast(
        createArcState({
          tokenBalances: { [ACCOUNT]: { [CHAIN_IDS.ARC]: { [TOKEN]: '0x0' } } },
        }),
      ),
    ).toBe(false);
  });
});
