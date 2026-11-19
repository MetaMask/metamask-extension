import React from 'react';
import { render } from '@testing-library/react';
import { useAddressLabel } from '#ui/hooks/useAddressLabel';
import type {
  ActivityListItem,
  MoneyAccountActivityItem,
} from '../../../../shared/lib/activity/types';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { useGetDisplayName } from '../../../hooks/useGetDisplayName';
import { useActivityRowContent } from './useActivityRowContent';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, substitutions?: string[]) =>
    substitutions ? `${key}|${substitutions.join(',')}` : key,
}));

const mockFormatTokenAmount = jest.fn();
const mockFormatAsFiat = jest.fn();

jest.mock('./useFormatTokenAmount', () => ({
  useFormatTokenAmount: () => mockFormatTokenAmount,
}));

jest.mock('../../../hooks/useFormatAsFiat', () => ({
  useFormatAsFiat: () => mockFormatAsFiat,
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

const mockGetDisplayName = jest.fn((_address: string): string => '');

jest.mock('../../../hooks/useGetDisplayName', () => ({
  useGetDisplayName: jest.fn(() => mockGetDisplayName),
  shortenDisplayAddress: (address: string) =>
    address ? '0x11111...11111' : '',
}));

jest.mock('#ui/hooks/useAddressLabel');

const mockUseAddressLabel = jest.mocked(useAddressLabel);

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

describe('useActivityRowContent', () => {
  beforeEach(() => {
    mockFormatTokenAmount.mockReset();
    mockFormatAsFiat.mockReset();
    mockFormatCurrencyWithMinThreshold.mockClear();
    mockGetDisplayName.mockReturnValue('');
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

    mockFormatTokenAmount.mockReturnValue('formatted source amount');
    mockFormatAsFiat.mockReturnValue('formatted source fiat');

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(activity),
    );

    expect(result.current.title.props.children).toBe(
      'activity_swapIncomplete_success_title|ETH',
    );
    expect(result.current.subtitle).toBe('activity_swap_success_description');
    expect(result.current.primaryAmount?.props.children).toBe(
      'formatted source amount',
    );
    expect(result.current.secondaryAmount).toBe('formatted source fiat');
  });

  it('omits amounts for an incomplete swap with a zero source placeholder', () => {
    const activity = {
      type: 'swap',
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      status: 'success',
      timestamp: 1,
      hash: 'signature',
      data: {
        from: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
        sourceToken: {
          direction: 'out',
          symbol: 'SOL',
          amount: '0',
          assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        },
      },
    } as ActivityListItem;

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(activity),
    );

    expect(result.current.primaryAmount).toBeUndefined();
    expect(result.current.secondaryAmount).toBeUndefined();
    expect(mockFormatTokenAmount).not.toHaveBeenCalled();
    expect(mockFormatAsFiat).not.toHaveBeenCalled();
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

    mockFormatTokenAmount.mockReturnValue('formatted amount');

    const { result } = renderHookWithProvider(() =>
      useActivityRowContent(activity),
    );

    expect(result.current.title.props.children).toBe(
      'activity_swap_success_title',
    );
    expect(result.current.subtitle).toBe('ETH → USDC');
    expect(result.current.primaryAmount?.props.children).toBe(
      'formatted amount',
    );
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

  describe('address subtitles', () => {
    const labelledAddress = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
    const otherAddress = '0x2222222222222222222222222222222222222222';

    const renderSubtitle = (activity: ActivityListItem) => {
      const { result } = renderHookWithProvider(() =>
        useActivityRowContent(activity),
      );
      return render(<>{result.current.subtitle}</>).container;
    };

    beforeEach(() => {
      mockUseAddressLabel.mockImplementation(({ address }) =>
        address === labelledAddress ? 'Relay' : '',
      );
    });

    it('shows the label of the send recipient', () => {
      const container = renderSubtitle({
        type: 'send',
        chainId: 'eip155:1',
        status: 'success',
        timestamp: 1,
        hash: '0xabc',
        data: { from: otherAddress, to: labelledAddress },
      } as ActivityListItem);

      expect(container).toHaveTextContent(
        'activity_send_success_description|Relay',
      );
    });

    it('shows the label of the receive sender', () => {
      const container = renderSubtitle({
        type: 'receive',
        chainId: 'eip155:1',
        status: 'success',
        timestamp: 1,
        hash: '0xabc',
        data: { from: labelledAddress, to: otherAddress },
      } as ActivityListItem);

      expect(container).toHaveTextContent(
        'activity_receive_success_description|Relay',
      );
    });

    it('shows the label of the contract being interacted with', () => {
      const container = renderSubtitle({
        type: 'contractInteraction',
        chainId: 'eip155:42161',
        status: 'success',
        timestamp: 1,
        hash: '0xabc',
        data: { from: otherAddress, to: labelledAddress },
      } as ActivityListItem);

      expect(container).toHaveTextContent(
        'activity_contractInteraction_success_description|Relay',
      );
    });

    it('falls back to "Contract" when a contract interaction has no address', () => {
      const container = renderSubtitle({
        type: 'contractInteraction',
        chainId: 'eip155:1',
        status: 'success',
        timestamp: 1,
        hash: '0xabc',
        data: { from: otherAddress, to: '' },
      } as ActivityListItem);

      expect(container).toHaveTextContent(
        'activity_contractInteraction_success_description|contract',
      );
    });
  });

  describe('money account rows', () => {
    const MUSD_ASSET_ID = 'eip155:1/erc20:0xmusd';

    const buildMoneyActivity = (
      type: MoneyAccountActivityItem['type'],
      fiatAmount?: string,
      status: MoneyAccountActivityItem['status'] = 'success',
    ): MoneyAccountActivityItem => ({
      type,
      chainId: 'eip155:1',
      status,
      timestamp: 1,
      hash: '0xabc',
      data: {
        from: '0x1111111111111111111111111111111111111111',
        ...(fiatAmount === undefined ? {} : { fiat: { amount: fiatAmount } }),
        token: {
          assetId: MUSD_ASSET_ID,
          direction: type === 'moneyAccountDeposit' ? 'out' : 'in',
          symbol: 'mUSD',
          decimals: 6,
          amount: '25500000',
        },
      },
    });

    it('renders a deposit like a send to the money account', () => {
      mockFormatTokenAmount.mockReturnValue('-25.5 mUSD');

      const { result } = renderHookWithProvider(() =>
        useActivityRowContent(
          buildMoneyActivity('moneyAccountDeposit', '25.5'),
        ),
      );

      expect(result.current.title.props.children).toBe(
        'activity_moneyAccountDeposit_success_title|mUSD',
      );
      expect(result.current.subtitle).toBe(
        'activity_moneyAccountDeposit_success_description',
      );
      expect(result.current.primaryAmount.props.children).toBe('-25.5 mUSD');
      expect(result.current.primaryAmount.props.className).toBe('');
    });

    it('renders a withdrawal like a receive from the money account', () => {
      mockFormatTokenAmount.mockReturnValue('+25.5 mUSD');

      const { result } = renderHookWithProvider(() =>
        useActivityRowContent(
          buildMoneyActivity('moneyAccountWithdraw', '25.5'),
        ),
      );

      expect(result.current.title.props.children).toBe(
        'activity_moneyAccountWithdraw_success_title|mUSD',
      );
      expect(result.current.subtitle).toBe(
        'activity_moneyAccountWithdraw_success_description',
      );
      expect(result.current.primaryAmount.props.children).toBe('+25.5 mUSD');
      expect(result.current.primaryAmount.props.className).toBe(
        'text-success-default',
      );
    });

    it('prefers the market-rate fiat amount as the secondary amount', () => {
      mockFormatAsFiat.mockReturnValue('-€23.10');

      const { result } = renderHookWithProvider(() =>
        useActivityRowContent(
          buildMoneyActivity('moneyAccountDeposit', '25.5'),
        ),
      );

      expect(result.current.secondaryAmount).toBe('-€23.10');
    });

    it('falls back to the pegged USD amount when no market rate is available', () => {
      const { result } = renderHookWithProvider(() =>
        useActivityRowContent(
          buildMoneyActivity('moneyAccountDeposit', '25.5'),
        ),
      );

      expect(mockFormatCurrencyWithMinThreshold).toHaveBeenCalledWith(
        -25.5,
        'usd',
      );
      expect(result.current.secondaryAmount).toBe('-25.5 usd');
    });

    it('adds a plus sign to the pegged USD amount of a withdrawal', () => {
      const { result } = renderHookWithProvider(() =>
        useActivityRowContent(
          buildMoneyActivity('moneyAccountWithdraw', '25.5'),
        ),
      );

      expect(result.current.secondaryAmount).toBe('+25.5 usd');
    });

    it('omits the secondary amount when the activity has no fiat value', () => {
      const { result } = renderHookWithProvider(() =>
        useActivityRowContent(buildMoneyActivity('moneyAccountDeposit')),
      );

      expect(result.current.secondaryAmount).toBeUndefined();
    });

    it('shows the quoted fiat as the primary amount before the mUSD amount is known', () => {
      mockFormatTokenAmount.mockReturnValue('-0 mUSD');
      mockFormatAsFiat.mockReturnValue('-$0.00');
      const activity = buildMoneyActivity(
        'moneyAccountDeposit',
        '25',
        'pending',
      );
      delete activity.data.token?.amount;

      const { result } = renderHookWithProvider(() =>
        useActivityRowContent(activity),
      );

      expect(result.current.primaryAmount.props.children).toBe('-25 usd');
      expect(result.current.secondaryAmount).toBeUndefined();
      expect(mockFormatTokenAmount).not.toHaveBeenCalled();
      expect(mockFormatAsFiat).not.toHaveBeenCalled();
    });

    it('marks a failed deposit title as an error', () => {
      const { result } = renderHookWithProvider(() =>
        useActivityRowContent(
          buildMoneyActivity('moneyAccountDeposit', '25.5', 'failed'),
        ),
      );

      expect(result.current.title.props.children).toBe(
        'activity_moneyAccountDeposit_failed_title|mUSD',
      );
      expect(result.current.title.props.className).toContain(
        'text-error-default',
      );
    });

    it('shows the mUSD token avatar', () => {
      const { result } = renderHookWithProvider(() =>
        useActivityRowContent(buildMoneyActivity('moneyAccountDeposit', '1')),
      );

      const { getByTestId } = render(result.current.avatar);
      expect(getByTestId('activity-avatar')).toHaveTextContent(MUSD_ASSET_ID);
    });
  });
});
