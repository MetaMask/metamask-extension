import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useConfirmContext } from '../../../context/confirm';
import { useDisplayName } from '../../../../../hooks/useDisplayName';
import { setAccountOverride } from '../../../../../store/controller-actions/transaction-pay-controller';
import { FromAccountRow } from './from-account-row';

jest.mock('../../../context/confirm');
jest.mock('../../../../../hooks/useDisplayName');
jest.mock(
  '../../../../../store/controller-actions/transaction-pay-controller',
  () => ({
    setAccountOverride: jest.fn(),
  }),
);

jest.mock('../../account-select-modal', () => ({
  AccountSelectModal: ({
    selectedAddress,
    onSelect,
    onClose,
  }: {
    selectedAddress: string;
    onSelect: (address: string) => void;
    onClose: () => void;
  }) => (
    <div data-testid="account-select-modal">
      <span data-testid="selected-address">{selectedAddress}</span>
      <button
        data-testid="select-other"
        onClick={() => onSelect('0x1234567890abcdef1234567890abcdef12345678')}
      >
        other
      </button>
      <button
        data-testid="select-same"
        onClick={() => onSelect('0xabcdef1234567890abcdef1234567890abcdef12')}
      >
        same
      </button>
      <button
        data-testid="select-override"
        onClick={() => onSelect('0x1234567890abcdef1234567890abcdef12345678')}
      >
        override
      </button>
      <button data-testid="modal-close" onClick={onClose}>
        close
      </button>
    </div>
  ),
}));

jest.mock(
  '../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: () => ({
      trackAlertMetrics: jest.fn(),
      trackInlineAlertClicked: jest.fn(),
    }),
  }),
);

jest.mock('../../../../../hooks/useAlerts', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => ({
    getFieldAlerts: () => [],
  }),
}));

jest.mock('../../../../../components/app/preferred-avatar', () => ({
  PreferredAvatar: () => <div data-testid="preferred-avatar" />,
}));

const FROM_ADDRESS_MOCK = '0xabcdef1234567890abcdef1234567890abcdef12';
const OTHER_ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678';
const CHAIN_ID_MOCK = '0x1';
const TX_ID_MOCK = 'test-id';

const mockStore = configureStore([thunk]);

function createStore({
  accountOverride,
}: {
  accountOverride?: string;
} = {}) {
  return mockStore({
    metamask: {
      transactionData: accountOverride
        ? {
            [TX_ID_MOCK]: {
              accountOverride,
            },
          }
        : {},
    },
  });
}

describe('FromAccountRow', () => {
  const useConfirmContextMock = jest.mocked(useConfirmContext);
  const useDisplayNameMock = jest.mocked(useDisplayName);
  const setAccountOverrideMock = jest.mocked(setAccountOverride);

  beforeEach(() => {
    jest.resetAllMocks();

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: TX_ID_MOCK,
        chainId: CHAIN_ID_MOCK,
        txParams: { from: FROM_ADDRESS_MOCK },
      },
    } as never);

    useDisplayNameMock.mockReturnValue({
      name: 'Account 1',
      subtitle: 'Wallet 1',
    } as never);

    setAccountOverrideMock.mockResolvedValue(undefined);
  });

  it('renders the from account row with the wallet label and account name', () => {
    const store = createStore();
    renderWithProvider(<FromAccountRow />, store);

    expect(screen.getByTestId('from-account-row')).toBeInTheDocument();
    expect(screen.getByText('From Wallet 1')).toBeInTheDocument();
    expect(screen.getByTestId('from-account-name')).toHaveTextContent(
      'Account 1',
    );
  });

  it('does not render a divider by default', () => {
    const store = createStore();
    renderWithProvider(<FromAccountRow />, store);

    expect(
      screen.queryByTestId('from-account-divider'),
    ).not.toBeInTheDocument();
  });

  it('renders a divider below the row when showDivider is true', () => {
    const store = createStore();
    renderWithProvider(<FromAccountRow showDivider />, store);

    expect(screen.getByTestId('from-account-divider')).toBeInTheDocument();
  });

  it('opens the account select modal with the current address when the pill is clicked', () => {
    const store = createStore();
    renderWithProvider(<FromAccountRow />, store);

    expect(
      screen.queryByTestId('account-select-modal'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('from-account-pill'));

    expect(screen.getByTestId('account-select-modal')).toBeInTheDocument();
    expect(screen.getByTestId('selected-address')).toHaveTextContent(
      FROM_ADDRESS_MOCK,
    );
  });

  it('displays the account override when one is set', () => {
    useDisplayNameMock.mockReturnValue({
      name: 'Account 2',
      subtitle: 'Wallet 2',
    } as never);

    const store = createStore({ accountOverride: OTHER_ADDRESS_MOCK });
    renderWithProvider(<FromAccountRow />, store);

    expect(screen.getByText('From Wallet 2')).toBeInTheDocument();
    expect(screen.getByTestId('from-account-name')).toHaveTextContent(
      'Account 2',
    );

    fireEvent.click(screen.getByTestId('from-account-pill'));

    expect(screen.getByTestId('selected-address')).toHaveTextContent(
      OTHER_ADDRESS_MOCK,
    );
  });

  it('sets the pay account override with the chosen address', () => {
    const store = createStore();
    renderWithProvider(<FromAccountRow />, store);

    fireEvent.click(screen.getByTestId('from-account-pill'));
    fireEvent.click(screen.getByTestId('select-other'));

    expect(setAccountOverrideMock).toHaveBeenCalledWith(
      TX_ID_MOCK,
      OTHER_ADDRESS_MOCK,
    );
  });

  it('does not set the account override when the current account is chosen', () => {
    const store = createStore();
    renderWithProvider(<FromAccountRow />, store);

    fireEvent.click(screen.getByTestId('from-account-pill'));
    fireEvent.click(screen.getByTestId('select-same'));

    expect(setAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('does not set the account override when the currently overridden account is chosen', () => {
    const store = createStore({ accountOverride: OTHER_ADDRESS_MOCK });
    renderWithProvider(<FromAccountRow />, store);

    fireEvent.click(screen.getByTestId('from-account-pill'));
    fireEvent.click(screen.getByTestId('select-override'));

    expect(setAccountOverrideMock).not.toHaveBeenCalled();
  });

  it('renders nothing when there is no from address', () => {
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: TX_ID_MOCK,
        chainId: CHAIN_ID_MOCK,
        txParams: {},
      },
    } as never);

    const store = createStore();
    const { container } = renderWithProvider(<FromAccountRow />, store);

    expect(container).toBeEmptyDOMElement();
  });
});
