/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, renderWithProvider, waitFor } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import messages from '../../../../app/_locales/en/messages.json';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import {
  CreateNamedSnapAccount,
  CreateNamedSnapAccountProps,
} from './create-named-snap-account';

const mockSnapSuggestedAccountName = 'Suggested Account Name';

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  getNextAvailableAccountName: jest.fn().mockResolvedValue('Snap Account 3'),
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
  methods: ETH_EOA_METHODS,
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
  methods: ETH_EOA_METHODS,
  type: 'eip155:eoa',
};

const render = (
  props: CreateNamedSnapAccountProps = {
    onActionComplete: jest.fn().mockResolvedValue({ success: true }),
    snapSuggestedAccountName: mockSnapSuggestedAccountName,
  },
  overrideAccountNames?: { [accountId: string]: string },
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
          [mockSnapAccount1.id]: {
            ...mockSnapAccount1,
            metadata: {
              ...mockSnapAccount1.metadata,
              name:
                overrideAccountNames?.[mockSnapAccount1.id] ||
                mockSnapAccount1.metadata.name,
            },
          },
          [mockSnapAccount2.id]: {
            ...mockSnapAccount2,
            metadata: {
              ...mockSnapAccount2.metadata,
              name:
                overrideAccountNames?.[mockSnapAccount2.id] ||
                mockSnapAccount2.metadata.name,
            },
          },
        },
        options: {},
        methods: ETH_EOA_METHODS,
        type: 'eip155:eoa',
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
      snapSuggestedAccountName: mockSnapSuggestedAccountName,
    });

    const input = await waitFor(() =>
      getByPlaceholderText(mockSnapSuggestedAccountName),
    );
    const newAccountName = 'New Account Name';

    fireEvent.change(input, {
      target: { value: newAccountName },
    });
    fireEvent.click(getByText(messages.addAccount.message));

    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalledTimes(1);
      expect(onActionComplete).toHaveBeenCalledWith({
        success: true,
        name: newAccountName,
      });
    });
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

    const submitButton = getByText(messages.addAccount.message);
    expect(submitButton).toHaveAttribute('disabled');
  });

  it('uses default account name when input is empty and fires onActionComplete with true when clicking "Add account"', async () => {
    const defaultAccountName = 'Snap Account 3';

    const onActionComplete = jest.fn();
    const { getByText, getByPlaceholderText } = render({
      onActionComplete,
    });

    fireEvent.click(getByText(messages.addAccount.message));

    await waitFor(() => {
      // Check if the input value has been updated to the default account name
      expect(getByPlaceholderText(defaultAccountName)).toBeInTheDocument();
      expect(onActionComplete).toHaveBeenCalledTimes(1);
      expect(onActionComplete).toHaveBeenCalledWith({
        success: true,
        name: '',
      });
    });
  });

  it('increases suffix on snap account names when suggested name is already taken', async () => {
    const onActionComplete = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      {
        onActionComplete,
        snapSuggestedAccountName: mockSnapSuggestedAccountName,
      },
      { [mockSnapAccount1.id]: mockSnapSuggestedAccountName },
    );

    await waitFor(() =>
      getByPlaceholderText(`${mockSnapSuggestedAccountName} 2`),
    );
    fireEvent.click(getByText(messages.addAccount.message));

    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalledTimes(1);
      expect(onActionComplete).toHaveBeenCalledWith({
        success: true,
        name: `${mockSnapSuggestedAccountName} 2`,
      });
    });
  });

  it('fires onActionComplete with false when clicking Cancel', async () => {
    const onActionComplete = jest.fn();
    const { getByText } = render({
      onActionComplete,
      snapSuggestedAccountName: mockSnapSuggestedAccountName,
    });

    fireEvent.click(getByText(messages.cancel.message));

    await waitFor(() => {
      expect(onActionComplete).toHaveBeenCalledTimes(1);
      expect(onActionComplete).toHaveBeenCalledWith({ success: false });
    });
  });
});
