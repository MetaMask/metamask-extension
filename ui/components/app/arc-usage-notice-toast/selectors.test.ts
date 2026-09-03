import mockState from '../../../../test/data/mock-state.json';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { selectShowArcUsageNoticeToast } from './selectors';

const ACCOUNT = '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc';

const createArcState = ({
  balance,
  arcUsageNoticeShown = false,
}: {
  balance?: string;
  arcUsageNoticeShown?: boolean;
}) =>
  ({
    metamask: {
      ...mockState.metamask,
      arcUsageNoticeShown,
      accountsByChainId: {
        ...mockState.metamask.accountsByChainId,
        ...(balance === undefined
          ? {}
          : { [CHAIN_IDS.ARC]: { [ACCOUNT]: { balance } } }),
      },
    },
  }) as unknown as Parameters<typeof selectShowArcUsageNoticeToast>[0];

describe('#selectShowArcUsageNoticeToast', () => {
  it('shows when an account has a non-zero Arc balance and the notice was never shown', () => {
    expect(
      selectShowArcUsageNoticeToast(
        createArcState({ balance: '0xde0b6b3a7640000' }),
      ),
    ).toBe(true);
  });

  it('does not show when the Arc balance is zero', () => {
    expect(
      selectShowArcUsageNoticeToast(createArcState({ balance: '0x0' })),
    ).toBe(false);
  });

  it('does not show when Arc has no tracked accounts', () => {
    expect(selectShowArcUsageNoticeToast(createArcState({}))).toBe(false);
  });

  it('does not show again once the notice was shown', () => {
    expect(
      selectShowArcUsageNoticeToast(
        createArcState({
          balance: '0xde0b6b3a7640000',
          arcUsageNoticeShown: true,
        }),
      ),
    ).toBe(false);
  });
});
