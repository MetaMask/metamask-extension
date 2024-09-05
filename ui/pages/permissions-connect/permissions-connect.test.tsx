import React from 'react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { ApprovalType } from '@metamask/controller-utils';
import { BtcAccountType } from '@metamask/keyring-api';
import { fireEvent } from '@testing-library/react';
import messages from '../../../app/_locales/en/messages.json';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import { CONNECT_ROUTE } from '../../helpers/constants/routes';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { shortenAddress } from '../../helpers/utils/util';
import PermissionApprovalContainer from './permissions-connect.container';

const mockPermissionRequestId = '0cbc1f26-8772-4512-8ad7-f547d6e8b72c';

jest.mock('../../store/actions', () => {
  return {
    ...jest.requireActual('../../store/actions'),
    getRequestAccountTabIds: jest.fn().mockReturnValue({
      type: 'SET_REQUEST_ACCOUNT_TABS',
      payload: {},
    }),
  };
});

const mockAccount = createMockInternalAccount({ name: 'Account 1' });
const mockBtcAccount = createMockInternalAccount({
  name: 'BTC Account',
  address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  type: BtcAccountType.P2wpkh,
});

const defaultProps = {
  history: {
    location: {
      pathname: `${CONNECT_ROUTE}/${mockPermissionRequestId}`,
    },
  },
  location: {
    pathname: `${CONNECT_ROUTE}/${mockPermissionRequestId}`,
  },
  match: {
    params: {
      id: mockPermissionRequestId,
    },
  },
};

const render = (
  props = defaultProps,
  type: ApprovalType = ApprovalType.WalletRequestPermissions,
) => {
  let pendingPermission;
  if (type === ApprovalType.WalletRequestPermissions) {
    pendingPermission = {
      id: mockPermissionRequestId,
      origin: 'https://metamask.io',
      type: ApprovalType.WalletRequestPermissions,
      time: 1721376328642,
      requestData: {
        metadata: {
          id: mockPermissionRequestId,
          origin: 'https://metamask.io',
        },
        permissions: {
          eth_accounts: {},
        },
      },
      requestState: null,
      expectsResult: false,
    };
  }

  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      internalAccounts: {
        accounts: {
          [mockAccount.id]: mockAccount,
          [mockBtcAccount.id]: mockBtcAccount,
        },
        selectedAccount: mockAccount.id,
      },
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: [mockAccount.address],
        },
        {
          type: 'Snap Keyring',
          accounts: [mockBtcAccount.address],
        },
      ],
      accounts: {
        [mockAccount.address]: {
          address: mockAccount.address,
          balance: '0x0',
        },
      },
      balances: {
        [mockBtcAccount.id]: {},
      },
      pendingApprovals: {
        [mockPermissionRequestId]: pendingPermission,
      },
    },
  };
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  const store = mockStore(state);

  return {
    render: renderWithProvider(
      <PermissionApprovalContainer {...props} />,
      store,
      `${CONNECT_ROUTE}/${mockPermissionRequestId}`,
    ),
    store,
  };
};

describe('PermissionApprovalContainer', () => {
  describe('ConnectPath', () => {
    it('renders correctly', () => {
      const {
        render: { container, getByText },
      } = render();
      expect(getByText(messages.next.message)).toBeInTheDocument();
      expect(getByText(messages.cancel.message)).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });

    it('renders the list without BTC accounts', async () => {
      const {
        render: { getByText, queryByText },
      } = render();
      expect(
        getByText(
          `${mockAccount.metadata.name} (${shortenAddress(
            mockAccount.address,
          )})`,
        ),
      ).toBeInTheDocument();
      expect(
        queryByText(
          `${mockBtcAccount.metadata.name} (${shortenAddress(
            mockBtcAccount.address,
          )})`,
        ),
      ).not.toBeInTheDocument();
    });
  });

  describe('Add new account', () => {
    it('displays the correct account number', async () => {
      const {
        render: { getByText },
        store,
      } = render();
      fireEvent.click(getByText(messages.newAccount.message));

      const dispatchedActions = store.getActions();

      expect(dispatchedActions).toHaveLength(2); // first action is 'SET_REQUEST_ACCOUNT_TABS'
      expect(dispatchedActions[1]).toStrictEqual({
        type: 'UI_MODAL_OPEN',
        payload: {
          name: 'NEW_ACCOUNT',
          onCreateNewAccount: expect.any(Function),
          newAccountNumber: 2,
        },
      });
    });
  });
});
