import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { showPrivateKey } from '../../../../app/_locales/en/messages.json';
import {
  setAccountDetailsAddress,
  exportAccount,
  hideWarning,
} from '../../../store/actions';
import { AccountDetails } from '.';

jest.mock('../../../store/actions.ts');

describe('AccountDetails', () => {
  const address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
  const mockSetAccountDetailsAddress = jest.fn();
  const mockExportAccount = jest.fn().mockResolvedValue(true);
  const mockHideWarning = jest.fn();

  beforeEach(() => {
    setAccountDetailsAddress.mockReturnValue(mockSetAccountDetailsAddress);
    exportAccount.mockReturnValue(mockExportAccount);
    hideWarning.mockReturnValue(mockHideWarning);
  });

  afterEach(() => jest.clearAllMocks());

  function render(props = {}, storeModifications = {}) {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
      ...storeModifications,
    });
    const allProps = { address, ...props };
    return renderWithProvider(<AccountDetails {...allProps} />, store);
  }

  it('should set account label when changing default account label', () => {
    render();

    const editButton = screen.getByTestId('editable-label-button');
    fireEvent.click(editButton);

    const editableInput = screen.getByTestId('editable-input');
    const newAccountLabel = 'New Label';

    fireEvent.change(editableInput, { target: { value: newAccountLabel } });

    expect(editableInput).toHaveAttribute('value', newAccountLabel);
  });

  it('shows export private key contents and password field when clicked', () => {
    const { queryByText, queryByPlaceholderText } = render();
    const exportPrivateKeyButton = queryByText(showPrivateKey.message);
    fireEvent.click(exportPrivateKeyButton);

    expect(queryByText('Show private key')).toBeInTheDocument();
    expect(queryByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('attempts to validate password when submitted', async () => {
    const password = 'password';

    const { queryByPlaceholderText, queryByText } = render();
    const exportPrivateKeyButton = queryByText(showPrivateKey.message);
    fireEvent.click(exportPrivateKeyButton);

    queryByPlaceholderText('Password').focus();
    await userEvent.keyboard(password);
    fireEvent.click(queryByText('Confirm'));

    expect(exportAccount).toHaveBeenCalledWith(password, address);
  });

  it('displays the private key when exposed in state', () => {
    const samplePrivateKey = '8675309';
    const { queryByText } = render(
      {},
      { appState: { accountDetail: { privateKey: samplePrivateKey } } },
    );

    const exportPrivateKeyButton = queryByText(showPrivateKey.message);
    fireEvent.click(exportPrivateKeyButton);

    expect(queryByText(samplePrivateKey)).toBeInTheDocument();
  });
});
