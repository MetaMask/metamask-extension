import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockTokenTransferConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { useDisplayName } from '../../../../../../hooks/useDisplayName';
import { TrustSignalDisplayState } from '../../../../../../hooks/useTrustSignals';
import { useTransferRecipient } from '../hooks/useTransferRecipient';
import { TransactionFlowSection } from './transaction-flow-section';

jest.mock('../hooks/useTransferRecipient');
jest.mock('../../../../../../hooks/useDisplayName');

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

const mockUseDisplayName = jest.mocked(useDisplayName);

describe('<TransactionFlowSection />', () => {
  const useTransferRecipientMock = jest.mocked(useTransferRecipient);

  const RECIPIENT_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

  beforeEach(() => {
    jest.resetAllMocks();
    useTransferRecipientMock.mockReturnValue(RECIPIENT_ADDRESS);
    mockUseDisplayName.mockReturnValue({
      name: null,
      hasPetname: false,
      isAccount: false,
      displayState: TrustSignalDisplayState.Unknown,
    });
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

  it('displays wallet name next to labels when subtitle is returned', () => {
    mockUseDisplayName.mockReturnValue({
      name: 'Account 1',
      hasPetname: true,
      isAccount: true,
      displayState: TrustSignalDisplayState.Petname,
      subtitle: 'Wallet 1',
    });

    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <TransactionFlowSection />,
      mockStore,
    );

    expect(getByText('From Wallet 1')).toBeInTheDocument();
    expect(getByText('To Wallet 1')).toBeInTheDocument();
  });

  it('displays plain labels when subtitle is not returned', () => {
    mockUseDisplayName.mockReturnValue({
      name: null,
      hasPetname: false,
      isAccount: false,
      displayState: TrustSignalDisplayState.Unknown,
      subtitle: undefined,
    });

    const state = getMockTokenTransferConfirmState({});
    const mockStore = configureMockStore([])(state);
    const { getByText, queryByText } = renderWithConfirmContextProvider(
      <TransactionFlowSection />,
      mockStore,
    );

    expect(getByText('From')).toBeInTheDocument();
    expect(getByText('To')).toBeInTheDocument();
    expect(queryByText(/Wallet/u)).not.toBeInTheDocument();
  });
});
