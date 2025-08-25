import { TransactionType } from '@metamask/transaction-controller';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { TransactionDescription } from '@ethersproject/abi';
import { getMockTokenTransferConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { useTokenTransactionData } from '../hooks/useTokenTransactionData';
import { TransactionFlowSection } from './transaction-flow-section';

jest.mock('../hooks/useTokenTransactionData');

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
  const useTokenTransactionDataMock = jest.mocked(useTokenTransactionData);

  beforeEach(() => {
    jest.resetAllMocks();

    useTokenTransactionDataMock.mockReturnValue({
      name: TransactionType.tokenMethodTransfer,
      args: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _to: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      },
    } as unknown as TransactionDescription);
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
