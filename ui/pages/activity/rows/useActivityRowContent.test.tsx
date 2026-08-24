import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { useGetDisplayName } from '../../../hooks/useGetDisplayName';
import { useActivityRowContent } from './useActivityRowContent';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, substitutions?: string[]) =>
    substitutions ? `${key}|${substitutions.join(',')}` : key,
}));

jest.mock('./useFormatTokenAmount', () => ({
  useFormatTokenAmount: () => jest.fn(),
}));

jest.mock('../../../hooks/useFormatAsFiat', () => ({
  useFormatAsFiat: () => jest.fn(),
}));

const mockFormatCurrencyWithMinThreshold = jest.fn(
  (amount: number, currency: string) => `${amount} ${currency}`,
);

jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: mockFormatCurrencyWithMinThreshold,
  }),
}));

jest.mock('../../../components/app/activity-list-item-avatar', () => ({
  ActivityAvatar: ({ tokens }: { tokens: (string | undefined)[] }) => (
    <div data-testid="activity-avatar">{JSON.stringify(tokens)}</div>
  ),
}));

jest.mock('../../../components/app/chain-badge/chain-badge', () => ({
  ChainBadge: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chain-badge">{children}</div>
  ),
}));

const mockGetDisplayName = jest.fn((address?: string): string =>
  address ? '0x11111...11111' : '',
);

jest.mock('../../../hooks/useGetDisplayName', () => ({
  useGetDisplayName: jest.fn(() => mockGetDisplayName),
}));

const mockUseGetDisplayName = useGetDisplayName as jest.MockedFunction<
  typeof useGetDisplayName
>;

const STELLAR_USDC_ASSET =
  'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';

const buildActivity = (type: 'assetActivation' | 'assetDeactivation') =>
  ({
    type,
    chainId: 'stellar:pubnet',
    status: 'success',
    timestamp: 1716367781000,
    hash: 'hash',
    data: {
      from: 'owner-address',
      token: {
        assetId: STELLAR_USDC_ASSET,
        symbol: 'USDC',
        direction: 'out',
      },
    },
  }) as unknown as ActivityListItem;

const tokenContractAddress = '0x1234567890abcdef1234567890abcdef12345678';
const usdcAssetId = `eip155:1/erc20:${tokenContractAddress}`;

const buildSpendingCapActivity = ({
  type = 'approveSpendingCap',
  status = 'success',
  symbol = 'USDC',
}: {
  type?: 'approveSpendingCap' | 'increaseSpendingCap' | 'revokeSpendingCap';
  status?: 'pending' | 'success';
  symbol?: string;
} = {}) =>
  ({
    type,
    chainId: 'eip155:1',
    status,
    timestamp: 1,
    hash: '0xabc',
    data: {
      from: '0x2222222222222222222222222222222222222222',
      token: {
        direction: 'out',
        symbol,
        assetId: usdcAssetId,
      },
    },
  }) as ActivityListItem;

const unchangedTitleCases = [
  ['increaseSpendingCap', 'activity_increaseSpendingCap_success_title'],
  ['revokeSpendingCap', 'activity_revokeSpendingCap_success_title'],
] as const;

describe('useActivityRowContent', () => {
  beforeEach(() => {
    mockGetDisplayName.mockImplementation((address?: string) =>
      address ? '0x11111...11111' : '',
    );
    mockUseGetDisplayName.mockReturnValue(mockGetDisplayName);
  });

  it('derives the activation title and subtitle from the token symbol', () => {
    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(buildActivity('assetActivation')),
    );

    expect(result.current.title.props.children).toBe(
      'activity_assetActivation_success_title|USDC',
    );
    expect(result.current.subtitle).toBe(
      'activity_assetActivation_success_description|USDC',
    );
  });

  it('derives the deactivation labels for an assetDeactivation activity', () => {
    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(buildActivity('assetDeactivation')),
    );

    expect(result.current.title.props.children).toBe(
      'activity_assetDeactivation_success_title|USDC',
    );
    expect(result.current.subtitle).toBe(
      'activity_assetDeactivation_success_description|USDC',
    );
  });

  it('falls back to source-only swap copy when destination is missing', () => {
    const activity = {
      type: 'swap',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      hash: '0xabc',
      data: {
        from: '0x1111111111111111111111111111111111111111',
        sourceToken: {
          direction: 'out',
          symbol: 'ETH',
          amount: '378900000000000',
          decimals: 18,
          assetId: 'eip155:1/slip44:60',
        },
      },
    } as ActivityListItem;

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(activity),
    );

    expect(result.current.title.props.children).toBe(
      'activity_swapIncomplete_success_title|ETH',
    );
    expect(result.current.subtitle).toBe('activity_swap_success_description');
  });

  it('uses a clean swap title with the token pair as subtitle', () => {
    const activity = {
      type: 'swap',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      hash: '0xabc',
      data: {
        from: '0x1111111111111111111111111111111111111111',
        sourceToken: {
          direction: 'out',
          symbol: 'ETH',
          amount: '1',
          decimals: 18,
        },
        destinationToken: {
          direction: 'in',
          symbol: 'USDC',
          amount: '2',
          decimals: 6,
        },
      },
    } as ActivityListItem;

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(activity),
    );

    expect(result.current.title.props.children).toBe(
      'activity_swap_success_title',
    );
    expect(result.current.subtitle).toBe('ETH → USDC');
  });

  it('names the provider in the ramp order subtitle', () => {
    const activity = {
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: {
        from: '0x2222222222222222222222222222222222222222',
        token: { direction: 'in', symbol: 'ETH', amount: '1' },
        fiat: { amount: '100', currency: 'USD' },
        provider: { id: '/providers/moonpay', name: 'MoonPay' },
      },
    } as ActivityListItem;

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(activity),
    );

    expect(result.current.title.props.children).toBe(
      'activity_rampBuy_success_title|ETH',
    );
    expect(result.current.subtitle).toBe('MoonPay');
  });

  it('omits the ramp subtitle when the provider is unnamed', () => {
    const activity = {
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1,
      data: {
        from: '0x2222222222222222222222222222222222222222',
        token: { direction: 'in', symbol: 'ETH', amount: '1' },
        provider: { id: '/providers/moonpay', name: '' },
      },
    } as ActivityListItem;

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(activity),
    );

    expect(result.current.subtitle).toBeUndefined();
  });

  it('shows a placeholder for a pending ramp order without a crypto amount', () => {
    const activity = {
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1,
      data: {
        from: '0x2222222222222222222222222222222222222222',
        token: { direction: 'in', symbol: 'ETH' },
        provider: { id: '/providers/moonpay', name: 'MoonPay' },
      },
    } as ActivityListItem;

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(activity),
    );

    expect(result.current.primaryAmount.props.children).toBe('... ETH');
  });

  it('shows an ellipsis without a symbol when pending and symbol is missing', () => {
    const activity = {
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1,
      data: {
        from: '0x2222222222222222222222222222222222222222',
        token: { direction: 'in' },
        provider: { id: '/providers/moonpay', name: 'MoonPay' },
      },
    } as ActivityListItem;

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(activity),
    );

    expect(result.current.primaryAmount.props.children).toBe('...');
  });

  it('uses the order fiat amount for the secondary amount on ramp sells', () => {
    const activity = {
      type: 'rampSell',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: {
        from: '0x2222222222222222222222222222222222222222',
        token: { direction: 'out', symbol: 'ETH', amount: '1' },
        fiat: { amount: '100', currency: 'USD' },
        provider: { id: '/providers/moonpay', name: 'MoonPay' },
      },
    } as ActivityListItem;

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(activity),
    );

    expect(result.current.subtitle).toBe('MoonPay');
    expect(result.current.title.props.children).toBe(
      'activity_rampSell_success_title|ETH',
    );
    expect(result.current.secondaryAmount).toBe('100 USD');
    expect(mockFormatCurrencyWithMinThreshold).toHaveBeenCalledWith(100, 'USD');
  });

  it('shows the display name in send To: subtitles', () => {
    const toAddress = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
    mockGetDisplayName.mockReturnValue('Alice');

    const activity = {
      type: 'send',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      hash: '0xabc',
      data: {
        from: '0x2222222222222222222222222222222222222222',
        to: toAddress,
        token: {
          direction: 'out',
          symbol: 'ETH',
          amount: '1',
          decimals: 18,
          assetId: 'eip155:1/slip44:60',
        },
      },
    } as ActivityListItem;

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(activity),
    );

    expect(mockGetDisplayName).toHaveBeenCalledWith(toAddress);
    expect(result.current.subtitle).toBe(
      'activity_send_success_description|Alice',
    );
  });

  it('shows the display name in receive From: subtitles', () => {
    const fromAddress = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
    mockGetDisplayName.mockReturnValue('Bob');

    const activity = {
      type: 'receive',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      hash: '0xabc',
      data: {
        from: fromAddress,
        to: '0x2222222222222222222222222222222222222222',
        token: {
          direction: 'in',
          symbol: 'ETH',
          amount: '1',
          decimals: 18,
          assetId: 'eip155:1/slip44:60',
        },
      },
    } as ActivityListItem;

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(activity),
    );

    expect(mockGetDisplayName).toHaveBeenCalledWith(fromAddress);
    expect(result.current.subtitle).toBe(
      'activity_receive_success_description|Bob',
    );
  });

  it('includes the token symbol in pending approve titles', () => {
    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(buildSpendingCapActivity({ status: 'pending' })),
    );

    expect(result.current?.title.props.children).toBe(
      'activity_approveSpendingCap_pending_title|USDC',
    );
  });

  it('includes the token symbol in successful approve titles', () => {
    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(buildSpendingCapActivity()),
    );

    expect(result.current?.title.props.children).toBe(
      'activity_approveSpendingCap_success_title|USDC',
    );
  });

  it('shows the approved token contract name in the subtitle', () => {
    mockGetDisplayName.mockReturnValue('USD Coin');

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(buildSpendingCapActivity()),
    );

    expect(mockGetDisplayName).toHaveBeenCalledWith(tokenContractAddress);
    expect(result.current?.subtitle).toBe(
      'activity_contractInteraction_success_description|USD Coin',
    );
  });

  it('falls back to the truncated contract address in the subtitle', () => {
    mockGetDisplayName.mockReturnValue('0x12345...45678');

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(buildSpendingCapActivity()),
    );

    expect(result.current?.subtitle).toBe(
      'activity_contractInteraction_success_description|0x12345...45678',
    );
  });

  it('uses a title without a symbol for an approve that has no token symbol', () => {
    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(buildSpendingCapActivity({ symbol: '' })),
    );

    expect(result.current.title.props.children).toBe(
      'activity_approveSpendingCapUnknownToken_success_title',
    );
  });

  it('uses a title without a symbol for a pending approve that has no token symbol', () => {
    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(
        buildSpendingCapActivity({ status: 'pending', symbol: '' }),
      ),
    );

    expect(result.current.title.props.children).toBe(
      'activity_approveSpendingCapUnknownToken_pending_title',
    );
  });

  for (const [type, expectedTitle] of unchangedTitleCases) {
    it(`keeps the ${type} title unchanged`, () => {
      const { result } = renderHookWithProvider(() =>
        useActivityRowContent(buildSpendingCapActivity({ type })),
      );

      expect(result.current?.title.props.children).toBe(expectedTitle);
    });
  }
});
