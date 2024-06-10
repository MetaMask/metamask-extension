import { KeyringTypes } from '@metamask/keyring-controller';
import {
  InternalAccount,
  EthAccountType,
  BtcMethod,
  BtcAccountType,
} from '@metamask/keyring-api';
import {
  ETH_EOA_METHODS,
  ETH_4337_METHODS,
} from '../../shared/constants/eth-methods';
import { AccountsState, isSelectedInternalAccountEth } from './accounts';

const MOCK_ACCOUNT_EOA: InternalAccount = {
  id: '4974fc00-c0fb-4a18-8535-8407ec6d1952',
  address: '0x123',
  options: {},
  methods: ETH_EOA_METHODS,
  type: EthAccountType.Eoa,
  metadata: {
    name: 'Account 1',
    keyring: { type: KeyringTypes.hd },
    importTime: 1691565967600,
    lastSelected: 1691565967656,
  },
};

const MOCK_ACCOUNT_ERC4337: InternalAccount = {
  id: '4d5921f2-2022-44ce-a84f-9f6a0f142a5c',
  address: '0x123',
  options: {},
  methods: ETH_EOA_METHODS.concat(ETH_4337_METHODS),
  type: EthAccountType.Erc4337,
  metadata: {
    name: 'Account 2',
    keyring: { type: KeyringTypes.snap },
    importTime: 1691565967600,
    lastSelected: 1691565967656,
  },
};

const MOCK_ACCOUNT_BIP122_P2WPKH: InternalAccount = {
  id: 'ae247df6-3911-47f7-9e36-28e6a7d96078',
  address: 'bc1qaabb',
  options: {},
  methods: [BtcMethod.SendMany],
  type: BtcAccountType.P2wpkh,
  metadata: {
    name: 'Bitcoin Account',
    keyring: { type: KeyringTypes.snap },
    importTime: 1691565967600,
    lastSelected: 1955565967656,
  },
};

const MOCK_STATE: AccountsState = {
  metamask: {
    internalAccounts: {
      selectedAccount: MOCK_ACCOUNT_EOA.id,
      accounts: {
        [MOCK_ACCOUNT_EOA.id]: MOCK_ACCOUNT_EOA,
        [MOCK_ACCOUNT_ERC4337.id]: MOCK_ACCOUNT_ERC4337,
        [MOCK_ACCOUNT_BIP122_P2WPKH.id]: MOCK_ACCOUNT_BIP122_P2WPKH,
      },
    },
  },
};

describe('Accounts Selectors', () => {
  describe('isSelectedInternalAccountEth', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      { type: MOCK_ACCOUNT_EOA.type, id: MOCK_ACCOUNT_EOA.id, isEth: true },
      {
        type: MOCK_ACCOUNT_ERC4337.type,
        id: MOCK_ACCOUNT_ERC4337.id,
        isEth: true,
      },
      {
        type: MOCK_ACCOUNT_BIP122_P2WPKH.type,
        id: MOCK_ACCOUNT_BIP122_P2WPKH.id,
        isEth: false,
      },
    ])(
      'returns $isEth if the account is: $type',
      ({ id, isEth }: { id: string; isEth: boolean }) => {
        const state = MOCK_STATE;

        state.metamask.internalAccounts.selectedAccount = id;
        expect(isSelectedInternalAccountEth(state)).toBe(isEth);
      },
    );

    it('returns false if none account is selected', () => {
      const state = MOCK_STATE;

      state.metamask.internalAccounts.selectedAccount = '';
      expect(isSelectedInternalAccountEth(MOCK_STATE)).toBe(false);
    });
  });
});
