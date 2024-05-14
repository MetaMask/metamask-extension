import { LavaDomeDebug } from '@lavamoat/lavadome-core';
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
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { AccountDetailsKey } from './account-details-key';
import { AccountDetails } from '.';

jest.mock('../../../store/actions.ts');

describe('AccountDetails', () => {
  const account = Object.values(
    mockState.metamask.internalAccounts.accounts,
  )[0];
  const { address } = account;
  const mockSetAccountDetailsAddress = jest.fn();
  const mockClearAccountDetails = jest.fn();
  const mockExportAccount = jest.fn().mockResolvedValue(true);
  const mockHideWarning = jest.fn();

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
    const textHook = 'FIND_ME';

    const { queryByText } = renderWithProvider(
      <div>
        {textHook}
        <AccountDetailsKey
          accountName="Account 1"
          onClose={jest.fn()}
          privateKey={samplePrivateKey}
        />
      </div>,
    );

    const hook = queryByText(textHook);
    const rootNode = hook.parentElement.querySelector('span');
    expect(LavaDomeDebug.getTextByRoot(rootNode)).toContain(samplePrivateKey);
  });

  it('should call AccountDetails.onClose()', () => {
    render();

    fireEvent.click(screen.getByLabelText('Close'));

    expect(screen.queryByText('Account 1')).toBeNull();
  });

  it('should show the snap account name', async () => {
    render({ address: '0xb552685e3d2790efd64a175b00d51f02cdafee5d' });

    const accountName = screen.getByText('Snap Account 1');

    expect(accountName).toBeInTheDocument();
  });
});
