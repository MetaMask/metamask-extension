import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/dom';
import { TransactionMeta } from '@metamask/transaction-controller';

import { flushPromises } from '../../../../../../../test/lib/timer-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { upgradeAccountConfirmation } from '../../../../../../../test/data/confirmations/batch-transaction';
import { Confirmation } from '../../../../types/confirm';
import {
  rejectPendingApproval,
  setSmartAccountOptInForAccounts,
} from '../../../../../../store/actions';
import { SmartAccountUpdateSplash } from './smart-account-update-splash';

jest.mock('../../../../../../hooks/useMultiPolling', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../../../../hooks/useMultiPolling', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../../../../store/actions', () => ({
  setAccountDetailsAddress: jest.fn(),
  rejectPendingApproval: jest.fn().mockReturnValue({}),
  setSmartAccountOptInForAccounts: jest.fn(),
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

describe('Splash', () => {
  it('renders correctly', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const { getByText } = renderWithConfirmContextProvider(
      <SmartAccountUpdateSplash />,
      mockStore,
    );

    expect(getByText('Use smart account?')).toBeInTheDocument();
  });

  it('closes after acknowledgement', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const { getAllByRole, container } = renderWithConfirmContextProvider(
      <SmartAccountUpdateSplash />,
      mockStore,
    );

    expect(container.firstChild).not.toBeNull();

    fireEvent.click(
      getAllByRole('button', {
        name: /Use smart account/iu,
      })[1],
    );

    expect(container.firstChild).toBeNull();
    expect(setSmartAccountOptInForAccounts).toHaveBeenCalledTimes(1);
  });

  it('reject confirmation if user does not accept', async () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const { getByRole } = renderWithConfirmContextProvider(
      <SmartAccountUpdateSplash />,
      mockStore,
    );

    fireEvent.click(
      getByRole('button', {
        name: /Don’t use smart account/iu,
      }),
    );
    await flushPromises();
    expect(rejectPendingApproval).toHaveBeenCalledTimes(1);
  });

  it('does not render for confirmation not coming from DAPP', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction({
        ...upgradeAccountConfirmation,
        origin: 'metamask',
      } as Confirmation),
    );
    const { container } = renderWithConfirmContextProvider(
      <SmartAccountUpdateSplash />,
      mockStore,
    );

    expect(container.firstChild).toBeNull();
  });

  it('does not render if smartAccountOptIn is true for user and its not hardware wallet account', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        {
          ...upgradeAccountConfirmation,
          origin: 'metamask',
        } as Confirmation,
        {
          metamask: {
            preferences: {
              smartAccountOptIn: true,
            },
            internalAccounts: {
              accounts: {
                '0x8a0bbcd42cf79e7cee834e7808eb2fef1cebdb87': {
                  address: '0x8a0bbcd42cf79e7cee834e7808eb2fef1cebdb87',
                  metadata: {
                    keyring: {
                      type: 'ledger',
                    },
                  },
                },
              },
            },
          },
        },
      ),
    );
    const { container } = renderWithConfirmContextProvider(
      <SmartAccountUpdateSplash />,
      mockStore,
    );

    expect(container.firstChild).toBeNull();
  });

  it('does not render is splash page is acknowledged for account', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        {
          ...upgradeAccountConfirmation,
          origin: 'metamask',
        } as Confirmation,
        {
          metamask: {
            upgradeSplashPageAcknowledgedForAccounts: [
              (upgradeAccountConfirmation as TransactionMeta).txParams.from,
            ],
          },
        },
      ),
    );
    const { container } = renderWithConfirmContextProvider(
      <SmartAccountUpdateSplash />,
      mockStore,
    );

    expect(container.firstChild).toBeNull();
  });

  it('open account selection when pencil icon is clicked', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const { getByText, getByTestId } = renderWithConfirmContextProvider(
      <SmartAccountUpdateSplash />,
      mockStore,
    );

    fireEvent.click(getByTestId('smart-account-update-edit'));
    expect(getByText('Edit accounts')).toBeInTheDocument();
  });
});
