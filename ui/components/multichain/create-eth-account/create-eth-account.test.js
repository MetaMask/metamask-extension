/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, renderWithProvider, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { CreateEthAccount } from '.';

const mockNewEthAccount = createMockInternalAccount({
  name: 'Eth Account 1',
  address: '0xb552685e3d2790efd64a175b00d51f02cdafee5d',
});

const render = (props = { onActionComplete: () => jest.fn() }) => {
  const store = configureStore(mockState);
  return renderWithProvider(<CreateEthAccount {...props} />, store);
};

const mockAddNewAccount = jest.fn().mockReturnValue(mockNewEthAccount);
const mockSetAccountLabel = jest.fn().mockReturnValue({ type: 'TYPE' });
const mockGetNextAvailableAccountName = jest.fn().mockReturnValue('Account 7');

jest.mock('../../../store/actions', () => ({
  addNewAccount: (...args) => mockAddNewAccount(...args),
  setAccountLabel: (...args) => mockSetAccountLabel(...args),
  getNextAvailableAccountName: (...args) =>
    mockGetNextAvailableAccountName(...args),
}));

describe('CreateEthAccount', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays account name input and suggests name', async () => {
    const { getByPlaceholderText } = render();

    await waitFor(() =>
      expect(getByPlaceholderText('Account 7')).toBeInTheDocument(),
    );
  });

  it('fires onActionComplete when clicked', async () => {
    const onActionComplete = jest.fn();
    const { getByText, getByPlaceholderText } = render({ onActionComplete });

    const input = await waitFor(() => getByPlaceholderText('Account 7'));
    const newAccountName = 'New Account Name';

    fireEvent.change(input, {
      target: { value: newAccountName },
    });
    fireEvent.click(getByText('Add account'));

    await waitFor(() => expect(mockAddNewAccount).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockSetAccountLabel).toHaveBeenCalledWith(
        mockNewEthAccount.address,
        newAccountName,
      ),
    );
    await waitFor(() => expect(onActionComplete).toHaveBeenCalled());
  });

  it(`doesn't allow duplicate account names`, async () => {
    const { getByText, getByPlaceholderText } = render();

    const input = await waitFor(() => getByPlaceholderText('Account 7'));
    const usedAccountName = 'Account 4';

    fireEvent.change(input, {
      target: { value: usedAccountName },
    });

    const submitButton = getByText('Add account');
    expect(submitButton).toHaveAttribute('disabled');
  });

  it('passes keyringId when creating account with multi-srp', async () => {
    const onActionComplete = jest.fn();
    const selectedKeyringId = 'test-keyring-id';
    const { getByText, getByPlaceholderText } = render({
      onActionComplete,
      selectedKeyringId,
    });

    const input = await waitFor(() => getByPlaceholderText('Account 7'));
    const newAccountName = 'New Account Name';

    fireEvent.change(input, {
      target: { value: newAccountName },
    });
    fireEvent.click(getByText('Add account'));

    await waitFor(() =>
      expect(mockAddNewAccount).toHaveBeenCalledWith(selectedKeyringId),
    );
    await waitFor(() =>
      expect(onActionComplete).toHaveBeenCalledWith(true, mockNewEthAccount),
    );
  });
});
