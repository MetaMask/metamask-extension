import React from 'react';
import testData from '../../../../.storybook/test-data';
import README from './README.mdx';
import SignatureRequestSIWE from './signature-request-siwe';

const { identities, selectedAddress } = testData.metamask;
const otherIdentity = Object.values(identities)[0];

export default {
  title: 'Components/App/SignatureRequestSIWE',

  component: SignatureRequestSIWE,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    txData: { control: 'object' },
    cancelPersonalMessage: { action: 'Cancel' },
    signPersonalMessage: { action: 'Sign' },
  },
};

const msgParams = {
  from: selectedAddress,
  data: '0x6c6f63616c686f73743a383038302077616e747320796f7520746f207369676e20696e207769746820796f757220457468657265756d206163636f756e743a0a3078466232433135303034333433393034653566343038323537386334653865313131303563463765330a0a436c69636b20746f207369676e20696e20616e642061636365707420746865205465726d73206f6620536572766963653a2068747470733a2f2f636f6d6d756e6974792e6d6574616d61736b2e696f2f746f730a0a5552493a20687474703a2f2f6c6f63616c686f73743a383038300a56657273696f6e3a20310a436861696e2049443a20310a4e6f6e63653a2053544d74364b514d7777644f58453330360a4973737565642041743a20323032322d30332d31385432313a34303a34302e3832335a0a5265736f75726365733a0a2d20697066733a2f2f516d653773733341525667787636725871565069696b4d4a3875324e4c676d67737a673133705972444b456f69750a2d2068747470733a2f2f6578616d706c652e636f6d2f6d792d776562322d636c61696d2e6a736f6e',
  origin: 'http://localhost:8080',
  siwe: {
    isSIWEMessage: true,
    isSIWEDomainValid: true,
    parsedMessage: {
      domain: 'localhost:8080',
      address: selectedAddress,
      statement:
        'Click to sign in and accept the Terms of Service: https://community.metamask.io/tos',
      uri: 'http://localhost:8080',
      version: '1',
      nonce: 'STMt6KQMwwdOXE306',
      chainId: 1,
      issuedAt: '2022-03-18T21:40:40.823Z',
      resources: [
        'ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu',
        'https://example.com/my-web2-claim.json',
      ],
    },
  },
};

const badDomainParams = {
  from: selectedAddress,
  data: '0x6c6f63616c686f73743a383038302077616e747320796f7520746f207369676e20696e207769746820796f757220457468657265756d206163636f756e743a0a3078466232433135303034333433393034653566343038323537386334653865313131303563463765330a0a436c69636b20746f207369676e20696e20616e642061636365707420746865205465726d73206f6620536572766963653a2068747470733a2f2f636f6d6d756e6974792e6d6574616d61736b2e696f2f746f730a0a5552493a20687474703a2f2f6c6f63616c686f73743a383038300a56657273696f6e3a20310a436861696e2049443a20310a4e6f6e63653a2053544d74364b514d7777644f58453330360a4973737565642041743a20323032322d30332d31385432313a34303a34302e3832335a0a5265736f75726365733a0a2d20697066733a2f2f516d653773733341525667787636725871565069696b4d4a3875324e4c676d67737a673133705972444b456f69750a2d2068747470733a2f2f6578616d706c652e636f6d2f6d792d776562322d636c61696d2e6a736f6e',
  origin: 'http://localhost:8080',
  siwe: {
    isSIWEMessage: true,
    isSIWEDomainValid: false,
    parsedMessage: {
      domain: 'baddomain.com',
      address: selectedAddress,
      statement:
        'Click to sign in and accept the Terms of Service: https://community.metamask.io/tos',
      uri: 'http://localhost:8080',
      version: '1',
      nonce: 'STMt6KQMwwdOXE306',
      chainId: 1,
      issuedAt: '2022-03-18T21:40:40.823Z',
      resources: [
        'ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu',
        'https://example.com/my-web2-claim.json',
      ],
    },
  },
};

const badAddressParams = {
  from: otherIdentity.address,
  data: '0x6c6f63616c686f73743a383038302077616e747320796f7520746f207369676e20696e207769746820796f757220457468657265756d206163636f756e743a0a3078466232433135303034333433393034653566343038323537386334653865313131303563463765330a0a436c69636b20746f207369676e20696e20616e642061636365707420746865205465726d73206f6620536572766963653a2068747470733a2f2f636f6d6d756e6974792e6d6574616d61736b2e696f2f746f730a0a5552493a20687474703a2f2f6c6f63616c686f73743a383038300a56657273696f6e3a20310a436861696e2049443a20310a4e6f6e63653a2053544d74364b514d7777644f58453330360a4973737565642041743a20323032322d30332d31385432313a34303a34302e3832335a0a5265736f75726365733a0a2d20697066733a2f2f516d653773733341525667787636725871565069696b4d4a3875324e4c676d67737a673133705972444b456f69750a2d2068747470733a2f2f6578616d706c652e636f6d2f6d792d776562322d636c61696d2e6a736f6e',
  origin: 'http://localhost:8080',
  siwe: {
    isSIWEMessage: true,
    isSIWEDomainValid: true,
    parsedMessage: {
      domain: 'localhost:8080',
      address: selectedAddress,
      statement:
        'Click to sign in and accept the Terms of Service: https://community.metamask.io/tos',
      uri: 'http://localhost:8080',
      version: '1',
      nonce: 'STMt6KQMwwdOXE306',
      chainId: 1,
      issuedAt: '2022-03-18T21:40:40.823Z',
      resources: [
        'ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu',
        'https://example.com/my-web2-claim.json',
      ],
    },
  },
};

const badDomainAndAddressParams = {
  from: otherIdentity.address,
  data: '0x6c6f63616c686f73743a383038302077616e747320796f7520746f207369676e20696e207769746820796f757220457468657265756d206163636f756e743a0a3078466232433135303034333433393034653566343038323537386334653865313131303563463765330a0a436c69636b20746f207369676e20696e20616e642061636365707420746865205465726d73206f6620536572766963653a2068747470733a2f2f636f6d6d756e6974792e6d6574616d61736b2e696f2f746f730a0a5552493a20687474703a2f2f6c6f63616c686f73743a383038300a56657273696f6e3a20310a436861696e2049443a20310a4e6f6e63653a2053544d74364b514d7777644f58453330360a4973737565642041743a20323032322d30332d31385432313a34303a34302e3832335a0a5265736f75726365733a0a2d20697066733a2f2f516d653773733341525667787636725871565069696b4d4a3875324e4c676d67737a673133705972444b456f69750a2d2068747470733a2f2f6578616d706c652e636f6d2f6d792d776562322d636c61696d2e6a736f6e',
  origin: 'http://localhost:8080',
  siwe: {
    isSIWEMessage: true,
    isSIWEDomainValid: false,
    parsedMessage: {
      domain: 'baddomain.com',
      address: selectedAddress,
      statement:
        'Click to sign in and accept the Terms of Service: https://community.metamask.io/tos',
      uri: 'http://localhost:8080',
      version: '1',
      nonce: 'STMt6KQMwwdOXE306',
      chainId: 1,
      issuedAt: '2022-03-18T21:40:40.823Z',
      resources: [
        'ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu',
        'https://example.com/my-web2-claim.json',
      ],
    },
  },
};

export const DefaultStory = (args) => {
  return <SignatureRequestSIWE {...args} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  txData: {
    msgParams,
  },
};

export const BadDomainStory = (args) => {
  return <SignatureRequestSIWE {...args} />;
};

BadDomainStory.args = {
  txData: {
    msgParams: badDomainParams,
  },
};

export const BadAddressStory = (args) => {
  return <SignatureRequestSIWE {...args} />;
};

BadAddressStory.args = {
  txData: {
    msgParams: badAddressParams,
  },
};

export const BadDomainAndAddressStory = (args) => {
  return <SignatureRequestSIWE {...args} />;
};

BadDomainAndAddressStory.args = {
  txData: {
    msgParams: badDomainAndAddressParams,
  },
};
