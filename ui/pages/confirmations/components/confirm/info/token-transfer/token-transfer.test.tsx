import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockTokenTransferConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { tEn } from '../../../../../../../test/lib/i18n-helpers';
import TokenTransferInfo from './token-transfer';

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

jest.mock('../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockResolvedValue({
    lowerTimeBound: 0,
    upperTimeBound: 60000,
  }),
}));

describe('TokenTransferInfo', () => {
  it('renders correctly', async () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TokenTransferInfo />,
      mockStore,
    );

    await waitFor(() => {
      expect(screen.getByText(tEn('networkFee') as string)).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });
});
