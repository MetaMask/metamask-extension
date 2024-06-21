/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { InternalAccount } from '@metamask/keyring-api';
import { fireEvent, renderWithProvider, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { CreateNamedSnapAccountProps } from './create-named-snap-account';
import { CreateNamedSnapAccount } from '.';

const mockAddress = '0x2a4d4b667D5f12C3F9Bf8F14a7B9f8D8d9b8c8fA';
const mockSnapSuggestedAccountName = 'Suggested Account Name';

const render = (
  props: CreateNamedSnapAccountProps = {
    onActionComplete: async () => Promise.resolve(),
    address: mockAddress,
    snapSuggestedAccountName: mockSnapSuggestedAccountName,
  },
) => {
  const store = configureStore(mockState);
  return renderWithProvider(<CreateNamedSnapAccount {...props} />, store);
};

const mockSetAccountLabel = jest.fn().mockReturnValue({ type: 'TYPE' });
const mockGetNextAvailableAccountName = jest
  .fn()
  .mockReturnValue('Snap Account 2');

jest.mock('../../../store/actions', () => ({
  setAccountLabel: (...args: string[]) => mockSetAccountLabel(...args),
  getNextAvailableAccountName: (...args: InternalAccount[]) =>
    mockGetNextAvailableAccountName(...args),
}));

describe('CreateNamedSnapAccount', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('displays account name input and suggested name', async () => {
    const { getByPlaceholderText } = render();

    await waitFor(() =>
      expect(
        getByPlaceholderText(mockSnapSuggestedAccountName),
      ).toBeInTheDocument(),
    );
  });

  it('renames account and fires onActionComplete with true when clicking "Add account"', async () => {
    const onActionComplete = jest.fn();
    const { getByText, getByPlaceholderText } = render({
      onActionComplete,
      address: mockAddress,
      snapSuggestedAccountName: mockSnapSuggestedAccountName,
    });

    const input = await waitFor(() =>
      getByPlaceholderText(mockSnapSuggestedAccountName),
    );
    const newAccountName = 'New Account Name';

    fireEvent.change(input, {
      target: { value: newAccountName },
    });
    fireEvent.click(getByText('Add account'));

    await waitFor(() =>
      expect(mockSetAccountLabel).toHaveBeenCalledWith(
        mockAddress,
        newAccountName,
      ),
    );
    await waitFor(() => expect(onActionComplete).toHaveBeenCalledWith(true));
  });

  it(`doesn't allow duplicate account names`, async () => {
    const { getByText, getByPlaceholderText } = render();

    const input = await waitFor(() =>
      getByPlaceholderText(mockSnapSuggestedAccountName),
    );
    const usedAccountName = 'Snap Account 1';

    fireEvent.change(input, {
      target: { value: usedAccountName },
    });

    const submitButton = getByText('Add account');
    expect(submitButton).toHaveAttribute('disabled');
  });

  it.only('uses default account name when input is empty and fires onActionComplete with true when clicking "Add account"', async () => {
    const defaultAccountName = 'Snap Account 2';

    const onActionComplete = jest.fn();
    const { getByText } = render({
      onActionComplete,
      address: mockAddress,
    });

    fireEvent.click(getByText('Add account'));

    await waitFor(() =>
      expect(mockSetAccountLabel).toHaveBeenCalledWith(
        mockAddress,
        defaultAccountName,
      ),
    );
    await waitFor(() => expect(onActionComplete).toHaveBeenCalledWith(true));
  });

  it('fires onActionComplete with false when clicking Cancel', async () => {
    const onActionComplete = jest.fn();
    const { getByText } = render({
      onActionComplete,
      address: mockAddress,
      snapSuggestedAccountName: mockSnapSuggestedAccountName,
    });

    fireEvent.click(getByText('Cancel'));

    await waitFor(() => expect(onActionComplete).toHaveBeenCalledWith(false));
  });
});
