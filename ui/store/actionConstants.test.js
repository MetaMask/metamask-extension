import freeze from 'deep-freeze-strict';
import reducers from '../ducks';
import * as actionConstants from './actionConstants';

describe('Redux actionConstants', () => {
  describe('SET_ACCOUNT_LABEL', () => {
    it('updates the state.metamask.identities[:i].name property of the state to the action.value.label', () => {
      const accountId = 'foo';
      const initialState = {
        metamask: {
          internalAccounts: {
            accounts: {
              [accountId]: {
                foo: {
                  address: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825',
                  id: accountId,
                  metadata: {
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  name: 'bar',
                  options: {},
                  supportedMethods: [
                    'personal_sign',
                    'eth_sendTransaction',
                    'eth_sign',
                    'eth_signTransaction',
                    'eth_signTypedData',
                    'eth_signTypedData_v1',
                    'eth_signTypedData_v2',
                    'eth_signTypedData_v3',
                    'eth_signTypedData_v4',
                  ],
                  type: 'eip155:eoa',
                },
              },
            },
            selectedAccount: accountId,
          },
        },
      };
      freeze(initialState);

      const action = {
        type: actionConstants.SET_ACCOUNT_LABEL,
        value: {
          accountId: 'foo',
          label: 'baz',
        },
      };
      freeze(action);

      const resultingState = reducers(initialState, action);
      expect(
        resultingState.metamask.internalAccounts.accounts[accountId].name,
      ).toStrictEqual(action.value.label);
    });
  });
});
