import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { useActivityRowContent } from './useActivityRowContent';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, substitutions?: string[]) =>
    substitutions ? `${key}|${substitutions.join(',')}` : key,
}));

jest.mock('./useFormatTokenAmount', () => ({
  useFormatTokenAmount: () => jest.fn(),
}));

jest.mock('./useFormatFiatAmount', () => ({
  useFormatFiatAmount: () => jest.fn(),
}));

jest.mock('../../../hooks/useFormatters', () => ({
  useFormatters: () => ({ formatCurrencyWithMinThreshold: jest.fn() }),
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

  it('keeps full swap copy when destination is present', () => {
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
      'activity_swap_success_title|ETH,USDC',
    );
  });
});
