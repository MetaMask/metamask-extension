import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen, fireEvent } from '@testing-library/react';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { act } from 'react-dom/test-utils';
import { sha256 } from '../../../../shared/modules/hash.utils';
import { KeyringType } from '../../../../shared/constants/keyring';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import InteractiveReplacementTokenNotification from './interactive-replacement-token-notification';

jest.mock('../../../../shared/modules/hash.utils');

const mockedGetCustodianToken = jest
  .fn()
  .mockReturnValue({ type: 'Custody', payload: 'token' });

const mockedGetAllCustodianAccountsWithToken = jest.fn().mockReturnValue({
  type: 'TYPE',
  payload: [
    {
      address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
      authDetails: { refreshToken: 'def' },
    },
  ],
});

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    getCustodianToken: mockedGetCustodianToken,
    getAllCustodianAccountsWithToken: mockedGetAllCustodianAccountsWithToken,
  }),
}));

jest.mock('../../../store/institutional/institution-actions', () => ({
  showInteractiveReplacementTokenModal: jest
    .fn()
    .mockReturnValue({ type: 'TYPE' }),
}));

describe('Interactive Replacement Token Notification', () => {
  const selectedAccount = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';

  const mockStore = {
    metamask: {
      providerConfig: {
        type: 'test',
      },
      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              name: 'Test Account',
              keyring: {
                type: 'Custody',
              },
            },
            options: {},
            methods: [...Object.values(EthMethod)],
            type: EthAccountType.Eoa,
          },
        },
        selectedAccount,
      },
      isUnlocked: false,
      interactiveReplacementToken: { oldRefreshToken: 'abc' },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      keyrings: [
        {
          type: KeyringType.imported,
          accounts: ['0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281', '0x2'],
        },
        {
          type: KeyringType.ledger,
          accounts: [],
        },
      ],
    },
  };

  it('should not render if show notification is false', () => {
    const store = configureMockStore([thunk])(mockStore);

    renderWithProvider(<InteractiveReplacementTokenNotification />, store);

    expect(
      screen.queryByTestId('interactive-replacement-token-notification'),
    ).not.toBeInTheDocument();
  });

  it('should render if show notification is true and click on learn more', async () => {
    const customMockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        isUnlocked: true,
        interactiveReplacementToken: { oldRefreshToken: 'def', url: 'url' },
        keyrings: [
          {
            type: 'Custody - Saturn',
            accounts: ['0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281'],
          },
        ],
      },
    };
    const store = configureMockStore([thunk])(customMockStore);

    sha256.mockReturnValue('def');
    await act(async () => {
      renderWithProvider(<InteractiveReplacementTokenNotification />, store);
    });

    expect(
      screen.getByTestId('interactive-replacement-token-notification'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('show-modal')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('show-modal'));
    });
  });

  it('should render and call showNotification when component starts', async () => {
    const customMockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        isUnlocked: true,
        interactiveReplacementToken: { oldRefreshToken: 'def', url: 'url' },
        keyrings: [
          {
            type: 'Custody - Saturn',
            accounts: ['0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281', '0x2'],
          },
          {
            type: KeyringType.ledger,
            accounts: [],
          },
        ],
      },
    };

    const store = configureMockStore([thunk])(customMockStore);

    sha256.mockReturnValue('def');
    await act(async () => {
      renderWithProvider(<InteractiveReplacementTokenNotification />, store);
    });

    expect(mockedGetCustodianToken).toHaveBeenCalled();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(
      screen.getByTestId('interactive-replacement-token-notification'),
    ).toBeInTheDocument();
  });
});
