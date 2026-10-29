import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { setBackgroundConnection } from '../../../store/background-connection';
import { RewardsVipBadge } from './RewardsVipBadge';

const mockGetVipTierForAccount = jest.fn();
setBackgroundConnection({
  rewardsGetVipTierForAccount: async (...args: unknown[]) =>
    mockGetVipTierForAccount(...args),
} as never);

const vipEnabledStore = () => {
  const store = createBridgeMockStore();
  store.metamask.remoteFeatureFlags.vipProgramEnabled = {
    enabled: true,
    minimumVersion: '0.0.0',
  };
  return store;
};

describe('RewardsVipBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when vip tier is 0', async () => {
    mockGetVipTierForAccount.mockResolvedValueOnce(0);

    const { container } = renderWithProvider(
      <RewardsVipBadge />,
      configureStore(vipEnabledStore()),
    );

    await waitFor(() => {
      expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
      expect(container).toMatchInlineSnapshot(`<div />`);
    });
  });

  it('renders null when vip tier is null', async () => {
    mockGetVipTierForAccount.mockResolvedValueOnce(null);

    const { container } = renderWithProvider(
      <RewardsVipBadge />,
      configureStore(vipEnabledStore()),
    );

    await waitFor(() => {
      expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
      expect(container).toMatchInlineSnapshot(`<div />`);
    });
  });

  it('renders the vip badge when tier is found', async () => {
    mockGetVipTierForAccount.mockResolvedValueOnce(5);

    const { container } = renderWithProvider(
      <RewardsVipBadge />,
      configureStore(vipEnabledStore()),
    );

    await waitFor(() => {
      expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('rewards-vip-badge')).toBeInTheDocument();
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div
            class="w-max rounded-md bg-gradient-to-r from-[#ECB920] to-[65%] to-[#ECBC2D]/[11%] p-[1px] border-1"
            data-testid="rewards-vip-badge"
          >
            <div
              class="w-max flex flex-row rounded-md bg-warning-inverse"
            >
              <div
                class="w-max flex flex-row rounded-md whitespace-nowrap px-2 py-0 gap-1 bg-[#ECBC2D]/[11%]"
              >
                <img
                  alt="Rewards points"
                  height="14"
                  src="./images/metamask-rewards-points-vip.svg"
                  width="14"
                />
                <p
                  class="text-default text-s-body-sm leading-s-body-sm tracking-s-body-sm md:text-l-body-sm md:leading-l-body-sm md:tracking-l-body-sm font-medium font-default"
                >
                  VIP 5
                </p>
              </div>
            </div>
          </div>
        </div>
      `);
    });
  });

  it('renders null when vip tier fetch throws an error', async () => {
    mockGetVipTierForAccount.mockRejectedValueOnce(new Error('test'));

    const { container } = renderWithProvider(
      <RewardsVipBadge />,
      configureStore(vipEnabledStore()),
    );

    await waitFor(() => {
      expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
      expect(container).toMatchInlineSnapshot(`<div />`);
    });
  });

  it('renders null and skips the lookup when vipProgramEnabled is false', () => {
    mockGetVipTierForAccount.mockResolvedValueOnce(5);

    const { container } = renderWithProvider(
      <RewardsVipBadge />,
      configureStore(createBridgeMockStore()),
    );

    expect(container).toMatchInlineSnapshot(`<div />`);
    expect(mockGetVipTierForAccount).not.toHaveBeenCalled();
  });
});
