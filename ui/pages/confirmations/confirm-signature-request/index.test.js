import React from 'react';
import configureMockStore from 'redux-mock-store';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import ConfTx from '.';

const mockState = {
  metamask: {
    identities: {
      '0x8eeee1781fd885ff5ddef7789486676961873d12': {
        address: '0x8eeee1781fd885ff5ddef7789486676961873d12',
        lastSelected: 1673587189888,
        name: 'Account 1',
      },
    },
    unapprovedMsgs: {},
    unapprovedMsgCount: 0,
    unapprovedPersonalMsgs: {},
    unapprovedPersonalMsgCount: 0,
    unapprovedTypedMessages: {
      267460284130106: {
        id: 267460284130106,
        msgParams: {
          data: '{"domain":{"chainId":"5","name":"Ether Mail","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC","version":"1"},"message":{"contents":"Hello, Bob!","from":{"name":"Cow","wallets":["0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826","0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF"]},"to":[{"name":"Bob","wallets":["0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB","0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57","0xB0B0b0b0b0b0B000000000000000000000000000"]}]},"primaryType":"Mail","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Group":[{"name":"name","type":"string"},{"name":"members","type":"Person[]"}],"Mail":[{"name":"from","type":"Person"},{"name":"to","type":"Person[]"},{"name":"contents","type":"string"}],"Person":[{"name":"name","type":"string"},{"name":"wallets","type":"address[]"}]}}',
          from: '0x8eeee1781fd885ff5ddef7789486676961873d12',
          version: 'V4',
          origin: 'https://metamask.github.io',
          signatureMethod: 'eth_signTypedData_v4',
        },
        time: 1674533844299,
        status: 'unapproved',
        type: 'eth_signTypedData',
      },
    },
    unapprovedTypedMessagesCount: 1,
    providerConfig: { chainId: '0x5', type: 'goerli' },
    currencyRates: {},
    keyrings: [],
    networkConfigurations: {},
    subjectMetadata: {},
    accountsByChainId: {
      '0x5': {},
    },
    internalAccounts: {
      accounts: {
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
          address: '0x8eeee1781fd885ff5ddef7789486676961873d12',
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: 'Account 1',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: [...Object.values(EthMethod)],
          type: EthAccountType.Eoa,
        },
      },
      selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    },
    accounts: {
      '0x8eeee1781fd885ff5ddef7789486676961873d12': {
        address: '0x8eeee1781fd885ff5ddef7789486676961873d12',
        balance: '0x7e64033f2fdb0436',
      },
    },
    addressBook: {},
    tokenList: {},
    preferences: {},
    snaps: {
      'local:http://localhost:8080/': {
        enabled: true,
        id: 'local:http://localhost:8080/',
        initialPermissions: {
          snap_dialog: {},
        },
        manifest: {
          description: 'An example MetaMask Snap.',
          initialPermissions: {
            snap_dialog: {},
          },
          manifestVersion: '0.1',
          proposedName: 'MetaMask Example Snap',
          repository: {
            type: 'git',
            url: 'https://github.com/MetaMask/snaps-skunkworks.git',
          },
          source: {
            location: {
              npm: {
                filePath: 'dist/bundle.js',
                iconPath: 'images/icon.svg',
                packageName: '@metamask/example-snap',
                registry: 'https://registry.npmjs.org/',
              },
            },
            shasum: '3lEt0yUu080DwV78neROaAAIQWXukSkMnP4OBhOhBnE=',
          },
          version: '0.6.0',
        },
        sourceCode: '(...)',
        status: 'stopped',
        svgIcon: '<svg>...</svg>',
        version: '0.6.0',
      },
      'npm:@metamask/test-snap-bip44': {
        id: 'npm:@metamask/test-snap-bip44',
        origin: 'npm:@metamask/test-snap-bip44',
        version: '5.1.2',
        iconUrl: null,
        initialPermissions: {
          'endowment:ethereum-provider': {},
        },
        manifest: {
          description: 'An example Snap that signs messages using BLS.',
          proposedName: 'BIP-44 Test Snap',
          repository: {
            type: 'git',
            url: 'https://github.com/MetaMask/test-snaps.git',
          },
          source: {
            location: {
              npm: {
                filePath: 'dist/bundle.js',
                packageName: '@metamask/test-snap-bip44',
                registry: 'https://registry.npmjs.org',
              },
            },
            shasum: 'L1k+dT9Q+y3KfIqzaH09MpDZVPS9ZowEh9w01ZMTWMU=',
          },
          version: '5.1.2',
        },
        versionHistory: [
          {
            date: 1680686075921,
            origin: 'https://metamask.github.io',
            version: '5.1.2',
          },
        ],
      },
    },
  },
  appState: {
    warning: null,
    txId: 0,
  },
  history: { mostRecentOverviewPage: '/' },
  send: { draftTransactions: {} },
};

describe('Confirm Signature Request Component', () => {
  const store = configureMockStore()(mockState);

  describe('render', () => {
    it('should match snapshot', () => {
      const { container } = renderWithProvider(<ConfTx />, store);
      expect(container).toMatchSnapshot();
    });
  });
});
