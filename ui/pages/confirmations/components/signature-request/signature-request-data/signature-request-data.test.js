import React from 'react';
import configureMockStore from 'redux-mock-store';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { sanitizeMessage } from '../../../../../helpers/utils/util';
import Identicon from '../../../../../components/ui/identicon';
import SignatureRequestData from './signature-request-data';

describe('Signature Request Data', () => {
  describe('render', () => {
    const mockStore = {
      metamask: {
        tokenList: {
          '0x514910771af9ca656af840dff83e8264ecf986ca': {
            address: '0x514910771af9ca656af840dff83e8264ecf986ca',
            symbol: 'LINK',
            decimals: 18,
            name: 'ChainLink Token',
            iconUrl:
              'https://crypto.com/price/coin-data/icon/LINK/color_icon.png',
            aggregators: [
              'Aave',
              'Bancor',
              'CMC',
              'Crypto.com',
              'CoinGecko',
              '1inch',
              'Paraswap',
              'PMM',
              'Zapper',
              'Zerion',
              '0x',
            ],
            occurrences: 12,
            unlisted: false,
          },
        },
        providerConfig: {
          type: 'test',
          chainId: '0x5',
        },
        identities: {
          '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826': {
            name: 'Account 1',
            address: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF': {
            name: 'Account 2',
            address: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
          },
        },
        internalAccounts: {
          accounts: {
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              address: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
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
            '07c2cfec-36c9-46c4-8115-3836d3ac9047': {
              address: '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
              id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
              metadata: {
                name: 'Account 2',
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
        addressBook: {
          '0x5': {
            '0x06195827297c7A80a443b6894d3BDB8824b43896': {
              address: '0x06195827297c7A80a443b6894d3BDB8824b43896',
              name: 'Address Book Account 1',
              chainId: '0x5',
            },
          },
        },
      },
    };

    const store = configureMockStore()(mockStore);

    const rawMessage = {
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
            '0x06195827297c7A80a443b6894d3BDB8824b43896',
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

    const messageData = sanitizeMessage(
      rawMessage.message,
      rawMessage.primaryType,
      rawMessage.types,
    );

    it('should render contents title', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value} />,
        store,
      );

      expect(getByText('Contents:')).toBeInTheDocument();
    });

    it('should render contants text', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value} />,
        store,
      );

      expect(getByText('Hello, Bob!')).toBeInTheDocument();
    });

    it('should render from title', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value} />,
        store,
      );

      expect(getByText('From:')).toBeInTheDocument();
    });

    it('should render name title in "from" object', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value.from.value} />,
        store,
      );

      expect(getByText('Name:')).toBeInTheDocument();
    });

    it('should render name text in "from" object', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value} />,
        store,
      );

      expect(getByText('Cow')).toBeInTheDocument();
    });

    it('should render wallets title in "from" object', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value.from.value} />,
        store,
      );

      expect(getByText('Wallets:')).toBeInTheDocument();
    });

    it('should render Identicon for first wallet in "from" object', () => {
      const iconImage = (
        <Identicon
          diameter={32}
          address={messageData.value.from.value.wallets.value[0].value}
        />
      );
      expect(iconImage).toBeDefined();
    });

    it('should render first account name from wallets array if address exists in internal account object', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value} />,
        store,
      );

      expect(getByText('Account 1')).toBeInTheDocument();
    });

    it('should render Identicon for second wallet in "from" object', () => {
      const iconImage = (
        <Identicon
          diameter={32}
          address={messageData.value.from.value.wallets.value[1].value}
        />
      );
      expect(iconImage).toBeDefined();
    });

    it('should render second account name from wallets array if address exists in internal account object', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value} />,
        store,
      );

      expect(getByText('Account 2')).toBeInTheDocument();
    });

    it('should render Identicon for third wallet in "from" object', () => {
      const iconImage = (
        <Identicon
          diameter={32}
          address={messageData.value.from.value.wallets.value[2].value}
        />
      );
      expect(iconImage).toBeDefined();
    });

    it('should render third account name from wallets array if address exists in address book object', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value} />,
        store,
      );

      expect(getByText('Address Book Account 1')).toBeInTheDocument();
    });

    it('should render name title in "to" array of objects', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value.to.value[0].value} />,
        store,
      );

      expect(getByText('Name:')).toBeInTheDocument();
    });

    it('should render name text in "to" array of objects', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value.to.value[0].value} />,
        store,
      );

      expect(getByText('Bob')).toBeInTheDocument();
    });

    it('should render wallets title in "to" array of objects', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value.to.value[0].value} />,
        store,
      );

      expect(getByText('Wallets:')).toBeInTheDocument();
    });

    it('should render Identicon for first wallet in "to" array of objects', () => {
      const iconImage = (
        <Identicon
          diameter={32}
          address={messageData.value.to.value[0].value.wallets.value[0].value}
        />
      );
      expect(iconImage).toBeDefined();
    });

    it('should render first shorten address from wallets array if address does not exists in internal account and address book objects', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value} />,
        store,
      );

      expect(getByText('0xbBbBB...bBBbB')).toBeInTheDocument();
    });

    it('should render Identicon for second wallet in "to" array of objects', () => {
      const iconImage = (
        <Identicon
          diameter={32}
          address={messageData.value.to.value[0].value.wallets.value[1].value}
        />
      );
      expect(iconImage).toBeDefined();
    });

    it('should render second shorten address from wallets array if address does not exists in internal account and address book objects', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value} />,
        store,
      );

      expect(getByText('0xB0Bda...bEa57')).toBeInTheDocument();
    });

    it('should render Identicon for third wallet in "to" array of objects', () => {
      const iconImage = (
        <Identicon
          diameter={32}
          address={messageData.value.to.value[0].value.wallets.value[2].value}
        />
      );
      expect(iconImage).toBeDefined();
    });

    it('should render third shorten address from wallets array if address does not exists in internal account and address book objects', () => {
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={messageData.value} />,
        store,
      );
      expect(getByText('0xB0B0b...00000')).toBeInTheDocument();
    });

    it('should escape RTL character in label or value', () => {
      const messageDataWithRTLCharacters = {
        ...rawMessage,
        message: {
          ...rawMessage.message,
          contents: 'Hello, \u202E Bob!',
          from: {
            'name\u202Ename': 'Cow \u202E Cow',
            'wallets\u202Ewallets': [
              '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
              '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
              '0x06195827297c7A80a443b6894d3BDB8824b43896',
            ],
          },
          to: [
            {
              'name\u202Ename': 'Bob \u202E Bob',
              'wallets\u202Ewallets': [
                '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                '0xB0B0b0b0b0b0B000000000000000000000000000',
              ],
            },
          ],
        },
        types: {
          ...rawMessage.types,
          Person: [
            { name: 'name\u202Ename', type: 'string' },
            { name: 'wallets\u202Ewallets', type: 'address[]' },
          ],
        },
      };
      const data = sanitizeMessage(
        messageDataWithRTLCharacters.message,
        messageDataWithRTLCharacters.primaryType,
        messageDataWithRTLCharacters.types,
      );
      const { getByText, getAllByText } = renderWithProvider(
        <SignatureRequestData data={data.value} />,
        store,
      );

      expect(getByText('Hello, \\u202E Bob!')).toBeInTheDocument();
      expect(getByText('Cow \\u202E Cow')).toBeInTheDocument();
      expect(getByText('Bob \\u202E Bob')).toBeInTheDocument();
      expect(getAllByText('Name\\u202Ename:')).toHaveLength(2);
      expect(getAllByText('Wallets\\u202Ewallets:')).toHaveLength(2);
    });
  });
});
