import { toChecksumHexAddress } from '@metamask/controller-utils';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { showPrivateKey } from '../../../../app/_locales/en/messages.json';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';
import { shortenAddress } from '../../../helpers/utils/util';
import {
  clearAccountDetails,
  exportAccount,
  hideWarning,
  setAccountDetailsAddress,
} from '../../../store/actions';
import configureStore from '../../../store/store';
import { AccountDetailsKey } from './account-details-key';
import { AccountDetails } from '.';

jest.mock('../../../store/actions.ts');

describe('AccountDetails', () => {
  const address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
  const mockClearAccountDetails = jest.fn();
  const mockExportAccount = jest.fn().mockResolvedValue(true);
  const mockHideWarning = jest.fn();
  const mockSetAccountDetailsAddress = jest.fn();

  beforeEach(() => {
    clearAccountDetails.mockReturnValue(mockClearAccountDetails);
    exportAccount.mockReturnValue(mockExportAccount);
    hideWarning.mockReturnValue(mockHideWarning);
    setAccountDetailsAddress.mockReturnValue(mockSetAccountDetailsAddress);
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

    const editableInput = screen.getByPlaceholderText('Account name');
    const newAccountLabel = 'New Label';

    fireEvent.change(editableInput, { target: { value: newAccountLabel } });

    expect(editableInput).toHaveAttribute('value', newAccountLabel);
  });

  it('shows export private key contents and password field when clicked', () => {
    const { queryByText, queryByPlaceholderText } = render();
    const exportPrivateKeyButton = queryByText(showPrivateKey.message);
    fireEvent.click(exportPrivateKeyButton);

    expect(
      queryByText(shortenAddress(toChecksumHexAddress(address))),
    ).toBeInTheDocument();

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

    expect(exportAccount).toHaveBeenCalledWith(
      password,
      address,
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('displays the private key when sent in props', () => {
    const samplePrivateKey = '8675309';

    const { queryByText } = renderWithProvider(
      <AccountDetailsKey
        accountName="Account 1"
        onClose={jest.fn()}
        privateKey={samplePrivateKey}
      />,
    );

    expect(queryByText(samplePrivateKey)).toBeInTheDocument();
  });

  it('should call AccountDetails.onClose()', () => {
    render();

    fireEvent.click(screen.getByLabelText('Close'));

    expect(screen.queryByText('Account 1')).toBeNull();
  });
});
