import { AccountSelector, Box, Field } from '@metamask/snaps-sdk/jsx';
import { fireEvent } from '@testing-library/react';
import { SnapId } from '@metamask/snaps-sdk';
import { SolAccountType, SolScope } from '@metamask/keyring-api';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderInterface } from '../test-utils';

describe('SnapUIAccountSelector', () => {
  it('renders an account selector', () => {
    const { container } = renderInterface(
      Box({
        children: AccountSelector({
          name: 'account-selector',
        }),
      }),
      {
        state: {
          'account-selector': {
            accountId: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            addresses: ['eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
          },
        },
      },
    );

    expect(
      container.getElementsByClassName('snap-ui-renderer__account-selector'),
    ).toHaveLength(1);
    expect(container).toMatchSnapshot();
  });

  it('can switch account', () => {
    const { container, getAllByTestId, getByText } = renderInterface(
      Box({
        children: AccountSelector({
          name: 'account-selector',
        }),
      }),
      {
        state: {
          'account-selector': {
            accountId: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            addresses: ['eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
          },
        },
      },
    );

    const accountSelector = container.getElementsByClassName(
      'snap-ui-renderer__account-selector',
    )[0];

    fireEvent.click(accountSelector);

    const accountOptions = getAllByTestId('snap-ui-renderer__selector-item');

    expect(accountOptions).toHaveLength(6);

    fireEvent.click(accountOptions[1]);

    expect(getByText('Test Account 2')).toBeInTheDocument();
  });

  it('can filter accounts owned by the snap', () => {
    const { container, getAllByTestId } = renderInterface(
      Box({
        children: AccountSelector({
          name: 'account-selector',
          hideExternalAccounts: true,
        }),
      }),
      {
        snapId: 'local:snap-id' as SnapId,
        state: {
          'account-selector': {
            accountId: '3deeb99-ba0d-4a4e-a0aa-033fc1f79ae3',
            addresses: ['eip155:1:0xb552685e3d2790efd64a175b00d51f02cdafee5d'],
          },
        },
      },
    );

    const accountSelector = container.getElementsByClassName(
      'snap-ui-renderer__account-selector',
    )[0];

    fireEvent.click(accountSelector);

    const accountOptions = getAllByTestId('snap-ui-renderer__selector-item');

    expect(accountOptions).toHaveLength(1);
  });

  it('can filter accounts by chainId', () => {
    const mockedMetamaskState = {
      metamask: {
        internalAccounts: {
          accounts: {
            ...mockState.metamask.internalAccounts.accounts,
            '00f8e632-f0b7-4953-9e20-a9faadf94288': {
              address: '7S3P4HxJpyyigGzodYwHtCxZyUQe9JiBMHyRWXArAaKv',
              id: '00f8e632-f0b7-4953-9e20-a9faadf94288',
              metadata: {
                importTime: 0,
                name: 'Snap Account 2',
                keyring: {
                  type: 'Snap Keyring',
                },
                snap: {
                  enabled: true,
                  id: 'local:snap-id',
                  name: 'snap-name',
                },
              },
              options: {},
              methods: ['some_method'],
              scopes: [SolScope.Mainnet],
              type: SolAccountType.DataAccount,
            },
          },
        },
      },
    };

    const { container, getAllByTestId } = renderInterface(
      Box({
        children: AccountSelector({
          name: 'account-selector',
          chainIds: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
        }),
      }),
      {
        // @ts-expect-error - type mismatch with mockState
        metamaskState: mockedMetamaskState,
        state: {
          'account-selector': {
            accountId: '00f8e632-f0b7-4953-9e20-a9faadf94288',
            addresses: [
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7S3P4HxJpyyigGzodYwHtCxZyUQe9JiBMHyRWXArAaKv',
            ],
          },
        },
      },
    );

    const accountSelector = container.getElementsByClassName(
      'snap-ui-renderer__account-selector',
    )[0];

    fireEvent.click(accountSelector);

    const accountOptions = getAllByTestId('snap-ui-renderer__selector-item');

    expect(accountOptions).toHaveLength(1);
  });

  it('renders inside a field', () => {
    const { container, getByText } = renderInterface(
      Box({
        children: Field({
          label: 'Account Selector',
          // @ts-expect-error - The Field type does not expect the AccountSelector component.
          children: AccountSelector({
            name: 'account-selector',
          }),
        }),
      }),
      {
        state: {
          'account-selector': {
            accountId: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            addresses: ['eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
          },
        },
      },
    );

    expect(getByText('Account Selector')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('can show an error', () => {
    const { container, getByText } = renderInterface(
      Box({
        children: Field({
          label: 'Account Selector',
          // @ts-expect-error - The Field type does not expect the AccountSelector component.
          children: AccountSelector({
            name: 'account-selector',
          }),
          error: 'This is an error',
        }),
      }),
      {
        state: {
          'account-selector': {
            accountId: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            addresses: ['eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
          },
        },
      },
    );

    expect(
      container.getElementsByClassName('snap-ui-renderer__account-selector'),
    ).toHaveLength(1);

    expect(getByText('This is an error')).toBeInTheDocument();
  });
});
