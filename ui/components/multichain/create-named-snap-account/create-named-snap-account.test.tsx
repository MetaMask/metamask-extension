/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, renderWithProvider, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { CreateNamedSnapAccountProps } from './create-named-snap-account';
import { CreateNamedSnapAccount } from '.';

const mockAddress = '0x2a4d4b667D5f12C3F9Bf8F14a7B9f8D8d9b8c8fA';
const mockSnapSuggestedAccountName = 'Suggested Account Name';

const mockSetAccountLabel = jest.fn().mockReturnValue({ type: 'TYPE' });

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setAccountLabel: (...args: string[]) => mockSetAccountLabel(...args),
}));

const mockSnapAccount1 = {
  address: '0xb552685e3d2790efd64a175b00d51f02cdafee5d',
  id: 'c3deeb99-ba0d-4a4e-a0aa-033fc1f79ae3',
  metadata: {
    name: 'Snap Account 1',
    keyring: {
      type: 'Snap Keyring',
    },
    snap: {
      id: 'snap-id',
      name: 'snap-name',
    },
  },
  options: {},
  methods: [
    'personal_sign',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
  type: 'eip155:eoa',
};
const mockSnapAccount2 = {
  address: '0x3c4d5e6f78901234567890abcdef123456789abc',
  id: 'f6gccd97-ba4d-4m7e-q3ahj-033fc1f79ae4',
  metadata: {
    name: 'Snap Account 2',
    keyring: {
      type: 'Snap Keyring',
    },
    snap: {
      id: 'snap-id',
      name: 'snap-name',
    },
  },
  options: {},
  methods: [
    'personal_sign',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
  type: 'eip155:eoa',
};

const render = (
  props: CreateNamedSnapAccountProps = {
    onActionComplete: jest.fn().mockResolvedValue({}),
    address: mockAddress,
    snapSuggestedAccountName: mockSnapSuggestedAccountName,
  },
) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      completedOnboarding: true,
      internalAccounts: {
        ...mockState.metamask.internalAccounts,
        accounts: {
          ...mockState.metamask.internalAccounts.accounts,
          [mockSnapAccount1.id]: mockSnapAccount1,
          [mockSnapAccount2.id]: mockSnapAccount2,
        },
      },
    },
  });
  return renderWithProvider(<CreateNamedSnapAccount {...props} />, store);
};

describe('CreateNamedSnapAccount', () => {
  afterEach(() => {
    jest.restoreAllMocks();
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

  it('uses default account name when input is empty and fires onActionComplete with true when clicking "Add account"', async () => {
    // Note: last account index is the temporary account created by the snap
    const defaultAccountName = 'Snap Account 2';

    const onActionComplete = jest.fn();
    const { getByText, getByPlaceholderText } = render({
      onActionComplete,
      address: mockAddress,
    });

    fireEvent.click(getByText('Add account'));

    await waitFor(() => expect(mockSetAccountLabel).toHaveBeenCalled());

    // Check if the input value has been updated to the default account name
    expect(getByPlaceholderText(defaultAccountName)).toBeInTheDocument();
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
