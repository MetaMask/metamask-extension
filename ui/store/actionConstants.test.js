import freeze from 'deep-freeze-strict';
import reducers from '../ducks';
import * as actionConstants from './actionConstants';

describe('Redux actionConstants', () => {
  describe('SET_ACCOUNT_LABEL', () => {
    it('updates the state.metamask.identities[:i].name property of the state to the action.value.label', () => {
      const initialState = {
        metamask: {
          identities: {
            foo: {
              name: 'bar',
            },
          },
          internalAccounts: {
            accounts: {
              mockId: {
                address: 'foo',
                id: 'mockid',
                metadata: {
                  name: 'bar',
                  keyring: {
                    type: 'HD Key Tree',
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
              },
            },
            selectedAccount: 'mockid',
          },
        },
      };
      freeze(initialState);

      const action = {
        type: actionConstants.SET_ACCOUNT_LABEL,
        value: {
          account: 'foo',
          label: 'baz',
        },
      };
      freeze(action);

      const resultingState = reducers(initialState, action);
      expect(resultingState.metamask.identities.foo.name).toStrictEqual(
        action.value.label,
      );
      expect(
        resultingState.metamask.internalAccounts.accounts.mockid.metadata.name,
      ).toStrictEqual(action.value.label);
    });
  });
});
