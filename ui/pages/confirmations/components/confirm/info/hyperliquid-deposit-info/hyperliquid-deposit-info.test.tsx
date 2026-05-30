import React from 'react';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { ARBITRUM_USDC, PERPS_CURRENCY } from '../../../../constants/perps';
import { HyperliquidDepositInfo } from './hyperliquid-deposit-info';

jest.mock('../../../../hooks/tokens/useAddToken', () => ({
  useAddToken: jest.fn(),
}));

jest.mock('../../../info/custom-amount-info', () => ({
  CustomAmountInfo: jest.fn(() => (
    <div data-testid="custom-amount-info-mock" />
  )),
}));

const useAddTokenMock = jest.mocked(useAddToken);
const customAmountInfoMock = jest.mocked(CustomAmountInfo);

describe('HyperliquidDepositInfo', () => {
  beforeEach(() => {
    useAddTokenMock.mockReset();
    customAmountInfoMock.mockClear();
  });

  it('registers Arbitrum USDC via useAddToken', () => {
    renderWithProvider(<HyperliquidDepositInfo />, configureStore(mockState));

    expect(useAddTokenMock).toHaveBeenCalledWith({
      chainId: ARBITRUM_USDC.chainId,
      decimals: ARBITRUM_USDC.decimals,
      symbol: ARBITRUM_USDC.symbol,
      tokenAddress: ARBITRUM_USDC.address,
    });
  });

  it('renders a separate CustomAmountInfo configured like the perps deposit screen', () => {
    renderWithProvider(<HyperliquidDepositInfo />, configureStore(mockState));

    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: PERPS_CURRENCY,
        hasMax: true,
        hidePayTokenAmount: true,
      }),
      expect.anything(),
    );
  });
});
