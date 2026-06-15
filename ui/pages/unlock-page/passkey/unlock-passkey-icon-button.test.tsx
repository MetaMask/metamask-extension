import React from 'react';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { UnlockPasskeyIconButton } from './unlock-passkey-icon-button';

describe('UnlockPasskeyIconButton', () => {
  const selectedTestAccountId = 'test-unlock-icon-account-id';

  const buildStore = () =>
    configureMockStore([thunk])({
      metamask: {
        internalAccounts: {
          selectedAccount: selectedTestAccountId,
          accounts: {
            [selectedTestAccountId]: {
              address: '0x0000000000000000000000000000000000000001',
              id: selectedTestAccountId,
              metadata: {
                name: 'Test',
                keyring: { type: 'HD Key Tree' },
              },
              options: {},
              methods: ETH_EOA_METHODS,
              type: EthAccountType.Eoa,
              scopes: [EthScope.Eoa],
            },
          },
        },
      },
    });

  it('invokes onClick when passkey icon is clicked', () => {
    const onClick = jest.fn();
    const { getByTestId } = renderWithProvider(
      <UnlockPasskeyIconButton disabled={false} onClick={onClick} />,
      buildStore(),
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-with-passkey'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
