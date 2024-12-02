import { TransactionType } from '@metamask/transaction-controller';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockTokenTransferConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { useDecodedTransactionData } from '../hooks/useDecodedTransactionData';
import { TransactionFlowSection } from './transaction-flow-section';

jest.mock('../hooks/useDecodedTransactionData', () => ({
  ...jest.requireActual('../hooks/useDecodedTransactionData'),
  useDecodedTransactionData: jest.fn(),
}));

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext.tsx',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackInlineAlertClicked: jest.fn(),
      trackAlertRender: jest.fn(),
      trackAlertActionClicked: jest.fn(),
    })),
  }),
);

describe('<TransactionFlowSection />', () => {
  const useDecodedTransactionDataMock = jest.fn().mockImplementation(() => ({
    pending: false,
    value: {
      data: [
        {
          name: TransactionType.tokenMethodTransfer,
          params: [
            {
              name: 'dst',
              type: 'address',
              value: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            },
            { name: 'wad', type: 'uint256', value: 0 },
          ],
        },
      ],
      source: 'Sourcify',
    },
  }));

  (useDecodedTransactionData as jest.Mock).mockImplementation(
    useDecodedTransactionDataMock,
  );

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
