import { act } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  getMockConfirmState,
  getMockContractInteractionConfirmState,
} from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { getGasFeeTimeEstimate } from '../../../../../../../store/actions';
import { useTransactionPaySourceAmounts } from '../../../../../hooks/pay/useTransactionPayData';
import { GasFeesSection } from './gas-fees-section';

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn(),
}));

jest.mock('../../../../../hooks/pay/useTransactionPayData', () => ({
  useTransactionPaySourceAmounts: jest.fn(),
}));

jest.mock(
  '../../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
      trackInlineAlertClicked: jest.fn(),
    })),
  }),
);

describe('<GasFeesSection />', () => {
  const middleware = [thunk];
  const useTransactionPaySourceAmountsMock = jest.mocked(
    useTransactionPaySourceAmounts,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    useTransactionPaySourceAmountsMock.mockReturnValue(undefined);
  });

  it('does not render component for gas fees section', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithConfirmContextProvider(
      <GasFeesSection />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders component for gas fees section', async () => {
    (getGasFeeTimeEstimate as jest.Mock).mockImplementation(() =>
      Promise.resolve({ upperTimeBound: '1000' }),
    );

    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore(middleware)(state);
    let container;
    await act(async () => {
      const renderResult = renderWithConfirmContextProvider(
        <GasFeesSection />,
        mockStore,
      );
      container = renderResult.container;

      // Wait for any asynchronous operations to complete
      await new Promise(setImmediate);
    });

    expect(container).toMatchSnapshot();
  });

  it('does not render when sourceAmounts exist', async () => {
    useTransactionPaySourceAmountsMock.mockReturnValue([
      {
        sourceAmountRaw: '1000000',
        sourceAmountHuman: '1.0',
        targetTokenAddress: '0x123',
      },
    ] as never);

    (getGasFeeTimeEstimate as jest.Mock).mockImplementation(() =>
      Promise.resolve({ upperTimeBound: '1000' }),
    );

    const state = getMockContractInteractionConfirmState();
    const mockStore = configureMockStore(middleware)(state);

    let container;
    await act(async () => {
      const renderResult = renderWithConfirmContextProvider(
        <GasFeesSection />,
        mockStore,
      );
      container = renderResult.container;
      await new Promise(setImmediate);
    });

    expect(container).toBeEmptyDOMElement();
  });
});
