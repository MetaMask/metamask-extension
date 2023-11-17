import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../test/lib/render-helpers';
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
    cachedBalances: {
      '0x5': {},
    },
    accounts: {
      '0x8eeee1781fd885ff5ddef7789486676961873d12': {
        address: '0x8eeee1781fd885ff5ddef7789486676961873d12',
        balance: '0x7e64033f2fdb0436',
      },
    },
    selectedAddress: '0x8eeee1781fd885ff5ddef7789486676961873d12',
    addressBook: {},
    tokenList: {},
    preferences: {},
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
