import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { BtcAccountType } from '@metamask/keyring-api';
import mockState from '../../../../../../test/data/mock-state.json';
import { fireEvent, renderWithProvider } from '../../../../../../test/jest';
import { SEND_STAGES } from '../../../../../ducks/send';
import {
  INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
  createMockInternalAccount,
} from '../../../../../../test/jest/mocks';
import type { MetaMaskReduxState } from '../../../../../store/store';
import { shortenAddress } from '../../../../../helpers/utils/util';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../../../app/scripts/lib/multichain/address';
import { SendPageAccountPicker } from '.';

type State = {
  metamask: Pick<
    MetaMaskReduxState['metamask'],
    'internalAccounts' | 'keyrings'
  >;
};

const render = (
  state: Partial<State> = {},
  props = {},
  sendStage = SEND_STAGES.ADD_RECIPIENT,
) => {
  const middleware = [thunk];
  const store = configureMockStore(middleware)({
    ...mockState,
    ...state,
    send: {
      ...INITIAL_SEND_STATE_FOR_EXISTING_DRAFT,
      stage: sendStage,
    },
    gas: { basicEstimateStatus: 'LOADING' },
    history: { mostRecentOverviewPage: 'activity' },
    metamask: {
      ...mockState.metamask,
      ...state.metamask,
      permissionHistory: {
        'https://test.dapp': {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1596681857076,
            },
          },
        },
      },
      subjects: {
        'https://test.dapp': {
          permissions: {
            'endowment:caip25': {
              caveats: [
                {
                  type: 'authorizedScopes',
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      'eip155:1': {
                        accounts: [
                          'eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                        ],
                      },
                    },
                    isMultichainOrigin: false,
                  },
                },
              ],
              invoker: 'https://test.dapp',
              parentCapability: 'endowment:caip25',
            },
          },
        },
      },
    },
    activeTab: {
      origin: 'https://test.dapp',
    },
  });
  return renderWithProvider(<SendPageAccountPicker {...props} />, store);
};

describe('SendPageAccountPicker', () => {
  describe('render', () => {
    it('renders correctly', () => {
      const { container, getByTestId } = render();
      expect(container).toMatchSnapshot();

      expect(getByTestId('send-page-account-picker')).toBeInTheDocument();
    });

    it('renders as disabled when editing a send', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { getByTestId } = render({}, {}, SEND_STAGES.EDIT);

      expect(getByTestId('send-page-account-picker')).toBeDisabled();
    });
  });

  describe('actions', () => {
    it('opens account picker when clicked', () => {
      const { getByTestId } = render();
      fireEvent.click(getByTestId('send-page-account-picker'));
      expect(
        document.querySelector('.multichain-account-menu-popover'),
      ).toBeInTheDocument();
    });
  });

  describe('Multichain', () => {
    it('cannot select BTC accounts', async () => {
      const mockAccount = createMockInternalAccount();
      const mockBtcAccount = createMockInternalAccount({
        name: 'Bitcoin Account',
        type: BtcAccountType.P2wpkh,
        address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      });
      const { queryByText, queryAllByTestId, getByTestId } = render({
        metamask: {
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
              metadata: {
                id: 'test-keyring-id-1',
                name: '',
              },
            },
            {
              type: 'Snap Keyring',
              accounts: [mockBtcAccount.address],
              metadata: {
                id: 'test-keyring-id-2',
                name: '',
              },
            },
          ],
        },
      });

      expect(queryByText(mockAccount.metadata.name)).toBeInTheDocument();

      const accountPicker = getByTestId('send-page-account-picker');
      fireEvent.click(accountPicker);

      const accountListAddresses = queryAllByTestId('account-list-address');
      expect(accountListAddresses).toHaveLength(1);

      const accountListAddressesContent = accountListAddresses[0].textContent;
      expect(accountListAddressesContent).toContain(
        shortenAddress(normalizeSafeAddress(mockAccount.address)),
      );
      expect(accountListAddressesContent).not.toContain(
        shortenAddress(normalizeSafeAddress(mockBtcAccount.address)),
      );
    });
  });
});
