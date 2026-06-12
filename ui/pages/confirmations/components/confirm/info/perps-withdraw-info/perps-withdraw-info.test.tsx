import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { usePerpsWithdrawDefaultToken } from '../../../../hooks/pay/usePerpsWithdrawDefaultToken';
import { usePerpsLiveAccount } from '../../../../../../hooks/perps/stream';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { ARBITRUM_USDC, PERPS_CURRENCY } from '../../../../constants/perps';
import { PerpsWithdrawInfo } from './perps-withdraw-info';

jest.mock('../../../../hooks/tokens/useAddToken', () => ({
  useAddToken: jest.fn(),
}));

// `useTransactionPayPostQuote` reads the current confirmation via
// `useConfirmContext`, which throws without a `ConfirmContextProvider`.
// The hook itself is exercised in its own unit tests; mock it out here so
// `PerpsWithdrawInfo` can render under the lighter `renderWithProvider`.
jest.mock('../../../../hooks/pay/useTransactionPayPostQuote', () => ({
  useTransactionPayPostQuote: jest.fn(),
}));

jest.mock('../../../../hooks/pay/usePerpsWithdrawDefaultToken', () => ({
  usePerpsWithdrawDefaultToken: jest.fn(),
}));

// `usePerpsLiveAccount` boots the perps stream manager which fires an
// async background RPC ("perpsInit"). In a stripped-down test render that
// produces a "Background connection not initialized" warning and an
// out-of-act `setIsReady` update. Stub it — the only thing this test cares
// about is that `PerpsWithdrawInfo` forwards the right props.
jest.mock('../../../../../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: jest.fn(),
}));

jest.mock('../../../info/custom-amount-info', () => ({
  CustomAmountInfo: jest.fn(({ children }) => (
    <div data-testid="custom-amount-info-mock">{children}</div>
  )),
}));

jest.mock('../../../perps-confirmations/perps-withdraw-balance', () => ({
  PerpsWithdrawBalance: () => <div data-testid="perps-withdraw-balance-mock" />,
}));

const useAddTokenMock = jest.mocked(useAddToken);
const customAmountInfoMock = jest.mocked(CustomAmountInfo);
const usePerpsWithdrawDefaultTokenMock = jest.mocked(
  usePerpsWithdrawDefaultToken,
);
const usePerpsLiveAccountMock = jest.mocked(usePerpsLiveAccount);

const DEFAULT_PREFERRED_TOKEN = {
  address: ARBITRUM_USDC.address,
  chainId: ARBITRUM_USDC.chainId,
};

describe('PerpsWithdrawInfo', () => {
  beforeEach(() => {
    useAddTokenMock.mockReset();
    customAmountInfoMock.mockClear();
    usePerpsWithdrawDefaultTokenMock.mockReturnValue(DEFAULT_PREFERRED_TOKEN);
    usePerpsLiveAccountMock.mockReturnValue({
      account: null,
      isInitialLoading: false,
    });
  });

  it('registers Arbitrum USDC via useAddToken', () => {
    renderWithProvider(<PerpsWithdrawInfo />, configureStore(mockState));

    expect(useAddTokenMock).toHaveBeenCalledWith({
      chainId: ARBITRUM_USDC.chainId,
      decimals: ARBITRUM_USDC.decimals,
      symbol: ARBITRUM_USDC.symbol,
      tokenAddress: ARBITRUM_USDC.address,
    });
  });

  it('renders CustomAmountInfo with the Perps currency and hidePayTokenAmount', () => {
    renderWithProvider(<PerpsWithdrawInfo />, configureStore(mockState));

    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: PERPS_CURRENCY,
        hidePayTokenAmount: true,
      }),
      expect.anything(),
    );
  });

  it('passes available-to-trade balance as the custom amount max source', () => {
    usePerpsLiveAccountMock.mockReturnValue({
      account: {
        spendableBalance: '0',
        withdrawableBalance: '321.098765',
      } as never,
      isInitialLoading: false,
    });

    renderWithProvider(<PerpsWithdrawInfo />, configureStore(mockState));

    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        balanceUsdOverride: 321.098765,
      }),
      expect.anything(),
    );
  });

  it('renders the PerpsWithdrawBalance child inside CustomAmountInfo', () => {
    renderWithProvider(<PerpsWithdrawInfo />, configureStore(mockState));

    expect(
      screen.getByTestId('perps-withdraw-balance-mock'),
    ).toBeInTheDocument();
  });

  it('passes hasMax to show percentage buttons', () => {
    renderWithProvider(<PerpsWithdrawInfo />, configureStore(mockState));

    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hasMax: true,
      }),
      expect.anything(),
    );
  });

  it('passes the default destination token from `usePerpsWithdrawDefaultToken` as `preferredToken`', () => {
    const lastUsed = {
      address: '0x9999999999999999999999999999999999999999' as const,
      chainId: '0x38' as const,
    };
    usePerpsWithdrawDefaultTokenMock.mockReturnValue(lastUsed);

    renderWithProvider(<PerpsWithdrawInfo />, configureStore(mockState));

    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({ preferredToken: lastUsed }),
      expect.anything(),
    );
  });

  it('uses `withdrawableBalance` for the percentage-button balance override', () => {
    // HyperLiquid Unified Account mode: `spendableBalance` is $0 because USDC
    // sits in the spot clearinghouse. `withdrawableBalance` is the unified value.
    usePerpsLiveAccountMock.mockReturnValue({
      account: {
        spendableBalance: '0',
        withdrawableBalance: '41.13',
      } as never,
      isInitialLoading: false,
    });

    renderWithProvider(<PerpsWithdrawInfo />, configureStore(mockState));

    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({ balanceUsdOverride: 41.13 }),
      expect.anything(),
    );
  });
});
