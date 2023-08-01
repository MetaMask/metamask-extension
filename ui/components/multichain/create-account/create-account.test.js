/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, renderWithProvider, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { CreateAccount } from '.';

const render = (props = { onActionComplete: () => jest.fn() }) => {
  const store = configureStore(mockState);
  return renderWithProvider(<CreateAccount {...props} />, store);
};

const mockInternalAccount = {
  id: '0179ecc1-19c2-4c78-8df9-e08b604665e9',
  name: 'test',
  address: '0x1',
  metadata: {
    keyring: {
      type: 'HD Key Tree',
    },
  },
  options: {},
  supportedMethods: [
    'personal_sign',
    'eth_sendTransaction',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData',
    'eth_signTypedData_v1',
    'eth_signTypedData_v2',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
  type: 'eip155:eoa',
};

const mockAddNewAccount = jest.fn().mockReturnValue(mockInternalAccount);
const mockSetAccountLabel = jest.fn().mockReturnValue({ type: 'TYPE' });

jest.mock('../../../store/actions', () => ({
  addNewAccount: (...args) => mockAddNewAccount(...args),
  setAccountLabel: (...args) => mockSetAccountLabel(...args),
}));

describe('CreateAccount', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays account name input and suggests name', () => {
    const { getByPlaceholderText } = render();

    expect(getByPlaceholderText('Account 5')).toBeInTheDocument();
  });

  it('fires onActionComplete when clicked', async () => {
    const onActionComplete = jest.fn();
    const { getByText, getByPlaceholderText } = render({ onActionComplete });

    const input = getByPlaceholderText('Account 5');
    const newAccountName = 'New Account Name';

    fireEvent.change(input, {
      target: { value: newAccountName },
    });
    fireEvent.click(getByText('Create'));

    await waitFor(() => expect(mockAddNewAccount).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockSetAccountLabel).toHaveBeenCalledWith(
        mockInternalAccount.id,
        newAccountName,
      ),
    );
    await waitFor(() => expect(onActionComplete).toHaveBeenCalled());
  });

  it(`doesn't allow duplicate account names`, async () => {
    const { getByText, getByPlaceholderText } = render();

    const input = getByPlaceholderText('Account 5');
    const usedAccountName = 'Account 4';

    fireEvent.change(input, {
      target: { value: usedAccountName },
    });

    const submitButton = getByText('Create');
    expect(submitButton).toHaveAttribute('disabled');
  });
});
