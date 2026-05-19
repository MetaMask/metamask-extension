import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import {
  createBridgeMockStore,
  MOCK_EVM_ACCOUNT,
} from '../../../../test/data/bridge/mock-bridge-store';
import { setBackgroundConnection } from '../../../store/background-connection';
import { formatAccountToCaipAccountId } from '../../../helpers/utils/rewards-utils';
import { RewardsVipBadge } from './RewardsVipBadge';

const mockGetVipTierForAccount = jest.fn();
setBackgroundConnection({
  rewardsGetVipTierForAccount: async (...args: unknown[]) =>
    mockGetVipTierForAccount(...args),
} as never);

describe('RewardsVipBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when vip tier is 0', async () => {
    mockGetVipTierForAccount.mockResolvedValueOnce(0);

    const { container } = renderWithProvider(
      // @ts-expect-error 123 is not a valid caip account id
      <RewardsVipBadge accountId="123" />,
      configureStore(createBridgeMockStore()),
    );

    await waitFor(() => {
      expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
      expect(mockGetVipTierForAccount.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "123",
      ]
    `);
      expect(container).toMatchInlineSnapshot(`<div />`);
    });
  });

  it('renders null when vip tier is null', async () => {
    mockGetVipTierForAccount.mockResolvedValueOnce(null);

    const { container } = renderWithProvider(
      // @ts-expect-error 123 is not a valid caip account id
      <RewardsVipBadge accountId="123" />,
      configureStore(createBridgeMockStore()),
    );

    await waitFor(() => {
      expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
      expect(mockGetVipTierForAccount.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "123",
      ]
    `);
      expect(container).toMatchInlineSnapshot(`<div />`);
    });
  });

  it('renders the vip badge when tier is found', async () => {
    mockGetVipTierForAccount.mockResolvedValueOnce(5);

    const accountId = formatAccountToCaipAccountId(
      MOCK_EVM_ACCOUNT.address,
      'eip155:1',
    );
    expect(accountId).toBeDefined();
    const { container } = renderWithProvider(
      // @ts-expect-error accountId is a valid caip account id
      <RewardsVipBadge accountId={accountId} />,
      configureStore(createBridgeMockStore()),
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
      expect(mockGetVipTierForAccount.mock.calls[0]).toMatchInlineSnapshot(`
              [
                "eip155:1:0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc",
              ]
          `);
    });
  });

  it('renders null when vip tier fetch throws an error', async () => {
    mockGetVipTierForAccount.mockRejectedValueOnce(new Error('test'));

    const { container } = renderWithProvider(
      // @ts-expect-error 123 is not a valid caip account id
      <RewardsVipBadge accountId="123" />,
      configureStore(createBridgeMockStore()),
    );

    await waitFor(() => {
      expect(mockGetVipTierForAccount).toHaveBeenCalledTimes(1);
      expect(mockGetVipTierForAccount.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "123",
      ]
    `);
      expect(container).toMatchInlineSnapshot(`<div />`);
    });
  });
});
