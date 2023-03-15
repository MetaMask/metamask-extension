import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/jest';
import mockState from '../../../../test/data/mock-state.json';
import SignatureRequestSIWE from './signature-request-siwe';

const subjectMetadata = {
  'https://metamask.github.io': {
    iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
    name: 'E2E Test Dapp',
    origin: 'https://metamask.github.io',
    extensionId: null,
    subjectType: 'website',
  },
};

const uncofirmedTransactions = {
  7744017281976947: {
    id: 5005351545948149,
    msgParams: {
      data: '{"domain":{"chainId":"11155111","name":"Ether Mail","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC","version":"1"},"message":{"contents":"Hello, Bob!","from":{"name":"Cow","wallets":["0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826","0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF"]},"to":[{"name":"Bob","wallets":["0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB","0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57","0xB0B0b0b0b0b0B000000000000000000000000000"]}]},"primaryType":"Mail","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Group":[{"name":"name","type":"string"},{"name":"members","type":"Person[]"}],"Mail":[{"name":"from","type":"Person"},{"name":"to","type":"Person[]"},{"name":"contents","type":"string"}],"Person":[{"name":"name","type":"string"},{"name":"wallets","type":"address[]"}]}}',
      from: '0x4f2407ce0bf55eeeed7fe2526bf01137c52cd4a6',
      origin: 'https://metamask.github.io',
      version: 'V4',
    },
    securityProviderResponse: null,
    status: 'unapproved',
    time: 1678880409775,
    type: 'eth_signTypedData',
  },
};

jest.mock('../../../selectors', () => ({
  getTotalUnapprovedMessagesCount: () => 5,
  getSubjectMetadata: () => subjectMetadata,
  getMostRecentOverviewPage: () => '',
  unconfirmedMessagesHashSelector: () => [],
  accountsWithSendEtherInfoSelector: () => [],
  unapprovedDecryptMsgsSelector: () => [],
  unapprovedEncryptionPublicKeyMsgsSelector: () => [],
  unconfirmedTransactionsHashSelector: () => uncofirmedTransactions,
}));

const baseProps = {
  cancelPersonalMessage: jest.fn(),
  signPersonalMessage: jest.fn(),
};

describe('SignatureRequestSIWE', () => {
  const store = configureMockStore()(mockState);
  let messageData;

  beforeEach(() => {
    messageData = {
      domain: {
        chainId: 97,
        name: 'Ether Mail',
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        version: '1',
      },
      message: {
        contents: 'Hello, Bob!',
        from: {
          name: 'Cow',
          wallets: [
            '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
          ],
        },
        to: [
          {
            name: 'Bob',
            wallets: [
              '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
              '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
              '0xB0B0b0b0b0b0B000000000000000000000000000',
            ],
          },
        ],
      },
      primaryType: 'Mail',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person[]' },
          { name: 'contents', type: 'string' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallets', type: 'address[]' },
        ],
      },
    };
  });
  it('should show Reject request button', () => {
    const msgParams = {
      data: JSON.stringify(messageData),
      version: 'V4',
      origin: 'https://metamask.github.io',
      from: 'test',
      siwe: { parsedMessage: { address: 'test' } },
    };

    const { getByText } = renderWithProvider(
      <SignatureRequestSIWE
        {...baseProps}
        txData={{
          msgParams,
        }}
      />,
      store,
    );
    const cancelAll = getByText('Reject 5 requests');
    expect(cancelAll).toBeInTheDocument();
  });

  it('should show multiple notifications header', () => {
    const msgParams = {
      data: JSON.stringify(messageData),
      version: 'V4',
      origin: 'https://metamask.github.io',
      from: 'test',
      siwe: { parsedMessage: { address: 'test' } },
    };

    const { container } = renderWithProvider(
      <SignatureRequestSIWE
        {...baseProps}
        txData={{
          msgParams,
        }}
      />,
      store,
    );
    expect(
      container.getElementsByClassName('signature-request-siwe-header'),
    ).toHaveLength(1);
  });
});
