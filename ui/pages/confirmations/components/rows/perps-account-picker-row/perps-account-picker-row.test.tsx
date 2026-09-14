import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { TransactionType } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useConfirmContext } from '../../../context/confirm';
import { useDisplayName } from '../../../../../hooks/useDisplayName';
import {
  PayWithOption,
  useConfirmationNavigationOptions,
} from '../../../hooks/useConfirmationNavigation';
import { updateEditableParams } from '../../../../../store/actions';
import { PerpsAccountPickerRow } from './perps-account-picker-row';

jest.mock('../../../context/confirm');
jest.mock('../../../../../hooks/useDisplayName');
jest.mock('../../../hooks/useConfirmationNavigation', () => ({
  PayWithOption: { MoneyAccount: 'money_account' },
  useConfirmationNavigationOptions: jest.fn(),
}));
jest.mock('../../../../../store/actions', () => ({
  updateEditableParams: jest.fn(() => () => Promise.resolve()),
}));

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
      <button data-testid="modal-close" onClick={onClose}>
        close
      </button>
    </div>
  ),
}));

jest.mock('../../../../../components/app/preferred-avatar', () => ({
  PreferredAvatar: () => <div data-testid="preferred-avatar" />,
}));

const FROM_ADDRESS_MOCK = '0xabcdef1234567890abcdef1234567890abcdef12';
const OTHER_ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678';
const CHAIN_ID_MOCK = '0x1';
const TX_ID_MOCK = 'test-id';

const mockStore = configureStore([thunk]);

describe('PerpsAccountPickerRow', () => {
  const useConfirmContextMock = jest.mocked(useConfirmContext);
  const useDisplayNameMock = jest.mocked(useDisplayName);
  const useConfirmationNavigationOptionsMock = jest.mocked(
    useConfirmationNavigationOptions,
  );
  const updateEditableParamsMock = jest.mocked(updateEditableParams);

  beforeEach(() => {
    jest.resetAllMocks();

    useConfirmationNavigationOptionsMock.mockReturnValue({
      payWithOption: PayWithOption.MoneyAccount,
    } as ReturnType<typeof useConfirmationNavigationOptions>);

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: TX_ID_MOCK,
        chainId: CHAIN_ID_MOCK,
        type: TransactionType.perpsDeposit,
        txParams: { from: FROM_ADDRESS_MOCK },
      },
    } as never);

    useDisplayNameMock.mockReturnValue({
      name: 'Account 1',
      subtitle: 'Wallet 1',
    } as never);

    updateEditableParamsMock.mockReturnValue((() =>
      Promise.resolve()) as never);
  });

  it('renders the perps destination account when paying with the money account', () => {
    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    expect(screen.getByTestId('perps-account-picker-row')).toBeInTheDocument();
    expect(screen.getByTestId('perps-account-picker-name')).toHaveTextContent(
      'Account 1 (Perps)',
    );
  });

  it('renders nothing when payWithOption is not MoneyAccount', () => {
    useConfirmationNavigationOptionsMock.mockReturnValue({
      payWithOption: undefined,
    } as ReturnType<typeof useConfirmationNavigationOptions>);

    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    expect(
      screen.queryByTestId('perps-account-picker-row'),
    ).not.toBeInTheDocument();
  });

  it('renders nothing when the confirmation is not a perps deposit', () => {
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        id: TX_ID_MOCK,
        type: TransactionType.simpleSend,
        txParams: { from: FROM_ADDRESS_MOCK },
      },
    } as never);

    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    expect(
      screen.queryByTestId('perps-account-picker-row'),
    ).not.toBeInTheDocument();
  });

  it('opens the account picker on row press', () => {
    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    expect(
      screen.queryByTestId('account-select-modal'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('perps-account-picker-pill'));

    expect(screen.getByTestId('account-select-modal')).toBeInTheDocument();
  });

  it('updates the transaction from address on account selection', () => {
    renderWithProvider(<PerpsAccountPickerRow />, mockStore({}));

    fireEvent.click(screen.getByTestId('perps-account-picker-pill'));
    fireEvent.click(screen.getByTestId('select-other'));

    expect(updateEditableParamsMock).toHaveBeenCalledWith(TX_ID_MOCK, {
      from: OTHER_ADDRESS_MOCK,
    });
  });
});
