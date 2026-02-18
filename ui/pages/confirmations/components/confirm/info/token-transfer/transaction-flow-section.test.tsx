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

  const RECIPIENT_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

  beforeEach(() => {
    jest.resetAllMocks();
    useTransferRecipientMock.mockReturnValue(RECIPIENT_ADDRESS);
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

  it('renders From and To labels', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <TransactionFlowSection />,
      mockStore,
    );

    expect(getByText('From')).toBeInTheDocument();
    expect(getByText('To')).toBeInTheDocument();
  });

  it('renders sender and recipient address sections', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { getByTestId } = renderWithConfirmContextProvider(
      <TransactionFlowSection />,
      mockStore,
    );

    expect(getByTestId('sender-address')).toBeInTheDocument();
    expect(getByTestId('recipient-address')).toBeInTheDocument();
  });

  it('displays the transaction flow section container', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { getByTestId } = renderWithConfirmContextProvider(
      <TransactionFlowSection />,
      mockStore,
    );

    expect(getByTestId('confirmation__transaction-flow')).toBeInTheDocument();
  });

  it('renders display name elements for sender and recipient', () => {
    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { getAllByTestId } = renderWithConfirmContextProvider(
      <TransactionFlowSection />,
      mockStore,
    );

    const displayNames = getAllByTestId('confirm-info-row-display-name');
    expect(displayNames).toHaveLength(2);
  });
});
