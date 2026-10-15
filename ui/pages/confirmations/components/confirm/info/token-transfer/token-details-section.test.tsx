import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  getMockConfirmStateForTransaction,
  getMockTokenTransferConfirmState,
} from '../../../../../../../test/data/confirmations/helper';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
import { TokenDetailsSection } from './token-details-section';

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('TokenDetailsSection', () => {
  it('renders correctly', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <TokenDetailsSection />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders network and interacting with details', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <TokenDetailsSection />,
      mockStore,
    );
    expect(getByText(messages.network.message)).toBeInTheDocument();
    expect(getByText(messages.networkNameGoerli.message)).toBeInTheDocument();
    expect(getByText(messages.interactingWith.message)).toBeInTheDocument();
  });

  it('renders the original interacting-with address when the transaction is wrapped', () => {
    const transactionMeta =
      genUnapprovedTokenTransferConfirmation() as TransactionMeta;
    transactionMeta.txParamsOriginal = { ...transactionMeta.txParams };
    transactionMeta.txParams = {
      ...transactionMeta.txParams,
      to: '0x1111111111111111111111111111111111111111',
    };
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(transactionMeta),
    );

    const { getByText, queryByText } = renderWithConfirmContextProvider(
      <TokenDetailsSection />,
      mockStore,
    );

    expect(getByText('0x07614...3ad68')).toBeInTheDocument();
    expect(queryByText('0x11111...11111')).not.toBeInTheDocument();
  });
});
