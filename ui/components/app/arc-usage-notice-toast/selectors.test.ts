import mockState from '../../../../test/data/mock-state.json';
import { selectShowArcUsageNoticeToast } from './selectors';

const ACCOUNT_ID = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';
const ARC_NATIVE_ASSET_ID = 'eip155:5042/slip44:5042';
const ARC_TOKEN_ASSET_ID =
  'eip155:5042/erc20:0x3600000000000000000000000000000000000000';
const MAINNET_TOKEN_ASSET_ID =
  'eip155:1/erc20:0x3600000000000000000000000000000000000000';

const ARC_NATIVE_INFO = {
  type: 'native' as const,
  decimals: 18,
  symbol: 'USDC',
};

const ARC_TOKEN_INFO = {
  type: 'erc20' as const,
  decimals: 18,
  symbol: 'USDC',
  name: 'USDC',
};

const createArcState = ({
  arcUsageNoticeShown = false,
  assetsBalance = {},
  assetsInfo = {},
}: {
  arcUsageNoticeShown?: boolean;
  assetsBalance?: Record<string, Record<string, { amount: string }>>;
  assetsInfo?: Record<string, Record<string, unknown>>;
}) =>
  ({
    metamask: {
      ...mockState.metamask,
      arcUsageNoticeShown,
      assetsBalance: {
        ...mockState.metamask.assetsBalance,
        ...assetsBalance,
      },
      assetsInfo: {
        ...mockState.metamask.assetsInfo,
        ...assetsInfo,
      },
    },
  }) as unknown as Parameters<typeof selectShowArcUsageNoticeToast>[0];

describe('#selectShowArcUsageNoticeToast', () => {
  it('shows when an account has a non-zero native Arc balance and the notice was never shown', () => {
    expect(
      selectShowArcUsageNoticeToast(
        createArcState({
          assetsBalance: {
            [ACCOUNT_ID]: {
              ...mockState.metamask.assetsBalance[ACCOUNT_ID],
              [ARC_NATIVE_ASSET_ID]: { amount: '1' },
            },
          },
          assetsInfo: {
            [ARC_NATIVE_ASSET_ID]: ARC_NATIVE_INFO,
          },
        }),
      ),
    ).toBe(true);
  });

  it('does not show when the native Arc balance is zero', () => {
    expect(
      selectShowArcUsageNoticeToast(
        createArcState({
          assetsBalance: {
            [ACCOUNT_ID]: {
              ...mockState.metamask.assetsBalance[ACCOUNT_ID],
              [ARC_NATIVE_ASSET_ID]: { amount: '0' },
            },
          },
          assetsInfo: {
            [ARC_NATIVE_ASSET_ID]: ARC_NATIVE_INFO,
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
          assetsBalance: {
            [ACCOUNT_ID]: {
              ...mockState.metamask.assetsBalance[ACCOUNT_ID],
              [ARC_NATIVE_ASSET_ID]: { amount: '1' },
            },
          },
          assetsInfo: {
            [ARC_NATIVE_ASSET_ID]: ARC_NATIVE_INFO,
          },
        }),
      ),
    ).toBe(false);
  });

  it('shows when the native Arc balance is zero but an Arc token balance is not', () => {
    expect(
      selectShowArcUsageNoticeToast(
        createArcState({
          assetsBalance: {
            [ACCOUNT_ID]: {
              ...mockState.metamask.assetsBalance[ACCOUNT_ID],
              [ARC_NATIVE_ASSET_ID]: { amount: '0' },
              [ARC_TOKEN_ASSET_ID]: { amount: '1' },
            },
          },
          assetsInfo: {
            [ARC_NATIVE_ASSET_ID]: ARC_NATIVE_INFO,
            [ARC_TOKEN_ASSET_ID]: ARC_TOKEN_INFO,
          },
        }),
      ),
    ).toBe(true);
  });

  it('does not show when the non-zero token balance is on another chain', () => {
    expect(
      selectShowArcUsageNoticeToast(
        createArcState({
          assetsBalance: {
            [ACCOUNT_ID]: {
              ...mockState.metamask.assetsBalance[ACCOUNT_ID],
              [MAINNET_TOKEN_ASSET_ID]: { amount: '1' },
            },
          },
          assetsInfo: {
            [MAINNET_TOKEN_ASSET_ID]: ARC_TOKEN_INFO,
          },
        }),
      ),
    ).toBe(false);
  });

  it('does not show when the Arc token balance is zero', () => {
    expect(
      selectShowArcUsageNoticeToast(
        createArcState({
          assetsBalance: {
            [ACCOUNT_ID]: {
              ...mockState.metamask.assetsBalance[ACCOUNT_ID],
              [ARC_TOKEN_ASSET_ID]: { amount: '0' },
            },
          },
          assetsInfo: {
            [ARC_TOKEN_ASSET_ID]: ARC_TOKEN_INFO,
          },
        }),
      ),
    ).toBe(false);
  });
});
