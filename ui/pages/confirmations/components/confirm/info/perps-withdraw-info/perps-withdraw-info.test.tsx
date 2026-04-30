import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
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

// `usePerpsLiveAccount` boots the perps stream manager which fires an
// async background RPC ("perpsInit"). In a stripped-down test render that
// produces a "Background connection not initialized" warning and an
// out-of-act `setIsReady` update. Stub it — the only thing this test cares
// about is that `PerpsWithdrawInfo` forwards the right props.
jest.mock('../../../../../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: () => ({ account: null, isInitialLoading: false }),
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

describe('PerpsWithdrawInfo', () => {
  beforeEach(() => {
    useAddTokenMock.mockReset();
    customAmountInfoMock.mockClear();
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

  it('renders the PerpsWithdrawBalance child inside CustomAmountInfo', () => {
    renderWithProvider(<PerpsWithdrawInfo />, configureStore(mockState));

    expect(
      screen.getByTestId('perps-withdraw-balance-mock'),
    ).toBeInTheDocument();
  });

  it('does not pass hasMax (percentage buttons hidden for MVP)', () => {
    renderWithProvider(<PerpsWithdrawInfo />, configureStore(mockState));

    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ hasMax: true }),
      expect.anything(),
    );
  });
});
