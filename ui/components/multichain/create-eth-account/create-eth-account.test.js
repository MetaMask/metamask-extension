/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, renderWithProvider, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { CreateEthAccount } from '.';

const render = (props = { onActionComplete: () => jest.fn() }) => {
  const store = configureStore(mockState);
  return renderWithProvider(<CreateEthAccount {...props} />, store);
};

const mockAddNewAccount = jest.fn().mockReturnValue({ type: 'TYPE' });
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
        { type: 'TYPE' },
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
});
