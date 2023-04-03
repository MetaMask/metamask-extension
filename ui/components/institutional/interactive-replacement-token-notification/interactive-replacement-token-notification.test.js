import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { sha256 } from '../../../../shared/modules/hash.utils';
import { KeyringType } from '../../../../shared/constants/keyring';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import InteractiveReplacementTokenNotification from './interactive-replacement-token-notification';

jest.mock('../../../../shared/modules/hash.utils');

const mockedShowInteractiveReplacementTokenModal = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });

const mockedGetCustodianToken = jest.fn().mockResolvedValueOnce('token');

const mockedGetCustodyAccountDetails = jest
  .fn()
  .mockResolvedValueOnce([
    {
      address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
      authDetails: { refreshToken: 'def' },
    },
  ]);

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    getCustodianToken: mockedGetCustodianToken,
    getCustodyAccountDetails: mockedGetCustodyAccountDetails,
    showInteractiveReplacementTokenModal:
      mockedShowInteractiveReplacementTokenModal,
  }),
}));

describe('Interactive Replacement Token Notification', () => {
  const address = '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f';

  const identities = {
    '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f': {
      address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
      name: 'Account 1',
    }
  };

  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
      selectedAddress: address,
      identities,
      isUnlocked: false,
      interactiveReplacementToken: { oldRefreshToken: 'abc' },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      keyrings: [
        {
          type: KeyringType.imported,
          accounts: ['0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', '0x2'],
        },
        {
          type: KeyringType.ledger,
          accounts: [],
        },
      ],
    },
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not render if show notification is false', () => {
    const store = configureMockStore()(mockStore);

    renderWithProvider(
      <InteractiveReplacementTokenNotification />,
      store,
    );

    expect(
      screen.queryByTestId('interactive-replacement-token-notification'),
    ).not.toBeInTheDocument();
  });

  it.skip('should render if show notification is true and click on learn more', async () => {
    const store = configureMockStore()(mockStore);

    const { container, getByTestId } = renderWithProvider(
      <InteractiveReplacementTokenNotification />,
      store,
    );

    sha256.mockResolvedValueOnce('def');
    await act(async () => {
      render(<InteractiveReplacementTokenNotification />);
    });

    expect(
      screen.getByTestId('interactive-replacement-token-notification'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('show-modal')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('show-modal'));
    });

    expect(
      initialProps.showInteractiveReplacementTokenModal,
    ).toHaveBeenCalledTimes(1);
  });

  it.skip('should render and call showNotification in componenDidMount', async () => {
    const customMockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        isUnlocked: true,
        interactiveReplacementToken: { oldRefreshToken: 'def', url: 'url' },
        keyrings: [
          {
            type: 'Custody',
            accounts: ['0x1', '0x2'],
          },
          {
            type: KeyringType.ledger,
            accounts: [],
          },
        ],
      },
    };

    const store = configureMockStore()(customMockStore);

    const { container, getByTestId } = renderWithProvider(
      <InteractiveReplacementTokenNotification />,
      store,
    );

    sha256.mockResolvedValueOnce('def');
    await act(async () => {
      render(<InteractiveReplacementTokenNotification />);
    });

    expect(mockedGetCustodianToken).toHaveBeenCalledTimes(1);
    expect(mockedGetCustodyAccountDetails).toHaveBeenCalledTimes(1);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(
      screen.getByTestId('interactive-replacement-token-notification'),
    ).toBeInTheDocument();
  });
});
