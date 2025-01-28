import { KeyringTypes } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  EthAccountType,
  BtcMethod,
  BtcAccountType,
  EthScopes,
  BtcScopes,
} from '@metamask/keyring-api';
import {
  ETH_EOA_METHODS,
  ETH_4337_METHODS,
} from '../../shared/constants/eth-methods';

export const MOCK_ACCOUNT_EOA: InternalAccount = {
  id: '4974fc00-c0fb-4a18-8535-8407ec6d1952',
  address: '0x123',
  options: {},
  methods: ETH_EOA_METHODS,
  scopes: [EthScopes.Namespace],
  type: EthAccountType.Eoa,
  metadata: {
    name: 'Account 1',
    keyring: { type: KeyringTypes.hd },
    importTime: 1691565967600,
    lastSelected: 1691565967656,
  },
};

export const MOCK_ACCOUNT_ERC4337: InternalAccount = {
  id: '4d5921f2-2022-44ce-a84f-9f6a0f142a5c',
  address: '0x123',
  options: {},
  methods: ETH_EOA_METHODS.concat(ETH_4337_METHODS),
  // Smart accounts might not be available on every EVM chains, but that's ok for mock purposes.
  scopes: [EthScopes.Namespace],
  type: EthAccountType.Erc4337,
  metadata: {
    name: 'Account 2',
    keyring: { type: KeyringTypes.snap },
    importTime: 1691565967600,
    lastSelected: 1691565967656,
  },
};

export const MOCK_ACCOUNT_BIP122_P2WPKH: InternalAccount = {
  id: 'ae247df6-3911-47f7-9e36-28e6a7d96078',
  address: 'bc1qwl8399fz829uqvqly9tcatgrgtwp3udnhxfq4k',
  options: {},
  methods: [BtcMethod.SendBitcoin],
  scopes: [BtcScopes.Mainnet],
  type: BtcAccountType.P2wpkh,
  metadata: {
    name: 'Bitcoin Account',
    keyring: { type: KeyringTypes.snap },
    importTime: 1691565967600,
    lastSelected: 1955565967656,
  },
};

export const MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET: InternalAccount = {
  id: 'fcdafe8b-4bdf-4e25-9051-e255b2a0af5f',
  address: 'tb1q6rmsq3vlfdhjdhtkxlqtuhhlr6pmj09y6w43g8',
  options: {},
  methods: [BtcMethod.SendBitcoin],
  scopes: [BtcScopes.Testnet],
  type: BtcAccountType.P2wpkh,
  metadata: {
    name: 'Bitcoin Testnet Account',
    keyring: { type: KeyringTypes.snap },
    importTime: 1691565967600,
    lastSelected: 1955565967656,
  },
};

export const MOCK_ACCOUNTS = {
  [MOCK_ACCOUNT_EOA.id]: MOCK_ACCOUNT_EOA,
  [MOCK_ACCOUNT_ERC4337.id]: MOCK_ACCOUNT_ERC4337,
  [MOCK_ACCOUNT_BIP122_P2WPKH.id]: MOCK_ACCOUNT_BIP122_P2WPKH,
  [MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET.id]: MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET,
};
