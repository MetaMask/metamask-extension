import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockTokenTransferConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { useTransferRecipient } from '../hooks/useTransferRecipient';
import { TransactionFlowSection } from './transaction-flow-section';

jest.mock('../hooks/useTransferRecipient');

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext.tsx',
  () => ({
    useAlertMetrics: () => ({
      trackInlineAlertClicked: jest.fn(),
      trackAlertRender: jest.fn(),
      trackAlertActionClicked: jest.fn(),
    }),
  }),
);

describe('<TransactionFlowSection />', () => {
  const useTransferRecipientMock = jest.mocked(useTransferRecipient);
  beforeEach(() => {
    jest.resetAllMocks();

    useTransferRecipientMock.mockReturnValue(
      '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    );
  });

  it('renders correctly', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TransactionFlowSection />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });
});
