import React from 'react';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import { useAddToken } from '../../../../hooks/tokens/useAddToken';
import { useDefaultPaySelectedSection } from '../../../../hooks/pay/useDefaultPaySelectedSection';
import { CustomAmountInfo } from '../../../info/custom-amount-info';
import { ARBITRUM_USDC, PERPS_CURRENCY } from '../../../../constants/perps';
import { PerpsDepositInfo } from './perps-deposit-info';

jest.mock('../../../../hooks/tokens/useAddToken', () => ({
  useAddToken: jest.fn(),
}));

jest.mock('../../../../hooks/pay/useDefaultPaySelectedSection', () => ({
  useDefaultPaySelectedSection: jest.fn(),
}));

jest.mock('../../../info/custom-amount-info', () => ({
  CustomAmountInfo: jest.fn(() => (
    <div data-testid="custom-amount-info-mock" />
  )),
}));

const useAddTokenMock = jest.mocked(useAddToken);
const customAmountInfoMock = jest.mocked(CustomAmountInfo);
const useDefaultPaySelectedSectionMock = jest.mocked(
  useDefaultPaySelectedSection,
);

describe('PerpsDepositInfo', () => {
  beforeEach(() => {
    useAddTokenMock.mockReset();
    customAmountInfoMock.mockClear();
    useDefaultPaySelectedSectionMock.mockClear();
  });

  it('applies the default pay selected section', () => {
    renderWithProvider(<PerpsDepositInfo />, configureStore(mockState));

    expect(useDefaultPaySelectedSectionMock).toHaveBeenCalled();
  });

  it('registers Arbitrum USDC via useAddToken', () => {
    renderWithProvider(<PerpsDepositInfo />, configureStore(mockState));

    expect(useAddTokenMock).toHaveBeenCalledWith({
      chainId: ARBITRUM_USDC.chainId,
      decimals: ARBITRUM_USDC.decimals,
      symbol: ARBITRUM_USDC.symbol,
      tokenAddress: ARBITRUM_USDC.address,
    });
  });

  it('renders CustomAmountInfo with the Perps currency and hidePayTokenAmount', () => {
    renderWithProvider(<PerpsDepositInfo />, configureStore(mockState));

    expect(customAmountInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: PERPS_CURRENCY,
        hidePayTokenAmount: true,
      }),
      expect.anything(),
    );
  });
});
