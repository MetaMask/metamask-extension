import freeze from 'deep-freeze-strict';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import reducers from '../ducks';
import * as actionConstants from './actionConstants';

describe('Redux actionConstants', () => {
  describe('SET_ACCOUNT_LABEL', () => {
    it('updates the state.metamask.internalAccounts.accounts[accountId].metadata.name property of the state to the action.value.label', () => {
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
                    name: 'bar',
                    keyring: {
                      type: 'HD Key Tree',
                    },
                  },
                  options: {},
                  methods: [...Object.values(EthMethod)],
                  type: EthAccountType.Eoa,
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
        resultingState.metamask.internalAccounts.accounts[accountId].metadata
          .name,
      ).toStrictEqual(action.value.label);
    });
  });
});
