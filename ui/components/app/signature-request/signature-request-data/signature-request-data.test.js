import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import Identicon from '../../../ui/identicon';
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
        provider: {
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

    let messageData;
    const store = configureMockStore()(mockStore);

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
    });

    it('should render domain chainId', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams} />,
        store,
      );

      expect(getByText('97')).toBeInTheDocument();
    });

    it('should render domain name', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams} />,
        store,
      );

      expect(getByText('Ether Mail')).toBeInTheDocument();
    });

    it('should render Identicon for domain verifying contract', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const iconImage = (
        <Identicon
          diameter={32}
          address={msgParams.data.domain.verifyingContract}
        />
      );
      expect(iconImage).toBeDefined();
    });

    it('should render domain verifying contract shorten address', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams} />,
        store,
      );

      expect(getByText('0xCcC...cccC')).toBeInTheDocument();
    });

    it('should render contents title', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams} />,
        store,
      );

      expect(getByText('Contents:')).toBeInTheDocument();
    });

    it('should render contants text', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams} />,
        store,
      );

      expect(getByText('Hello, Bob!')).toBeInTheDocument();
    });

    it('should render from title', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams} />,
        store,
      );

      expect(getByText('From:')).toBeInTheDocument();
    });

    it('should render name title in "from" object', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams.data.message.from} />,
        store,
      );

      expect(getByText('Name:')).toBeInTheDocument();
    });

    it('should render name text in "from" object', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams} />,
        store,
      );

      expect(getByText('Cow')).toBeInTheDocument();
    });

    it('should render wallets title in "from" object', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams.data.message.from} />,
        store,
      );

      expect(getByText('Wallets:')).toBeInTheDocument();
    });

    it('should render Identicon for first wallet in "from" object', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const iconImage = (
        <Identicon
          diameter={32}
          address={msgParams.data.message.from.wallets[0]}
        />
      );
      expect(iconImage).toBeDefined();
    });

    it('should render first account name from wallets array if address exists in identities object', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams} />,
        store,
      );

      expect(getByText('Account 1')).toBeInTheDocument();
    });

    it('should render Identicon for second wallet in "from" object', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const iconImage = (
        <Identicon
          diameter={32}
          address={msgParams.data.message.from.wallets[1]}
        />
      );
      expect(iconImage).toBeDefined();
    });

    it('should render second account name from wallets array if address exists in identities object', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams} />,
        store,
      );

      expect(getByText('Account 2')).toBeInTheDocument();
    });

    it('should render Identicon for third wallet in "from" object', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const iconImage = (
        <Identicon
          diameter={32}
          address={msgParams.data.message.from.wallets[2]}
        />
      );
      expect(iconImage).toBeDefined();
    });

    it('should render third account name from wallets array if address exists in address book object', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams} />,
        store,
      );

      expect(getByText('Address Book Account 1')).toBeInTheDocument();
    });

    it('should render name title in "to" array of objects', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams.data.message.to[0]} />,
        store,
      );

      expect(getByText('Name:')).toBeInTheDocument();
    });

    it('should render name text in "to" array of objects', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams.data.message.to[0]} />,
        store,
      );

      expect(getByText('Bob')).toBeInTheDocument();
    });

    it('should render wallets title in "to" array of objects', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams.data.message.to[0]} />,
        store,
      );

      expect(getByText('Wallets:')).toBeInTheDocument();
    });

    it('should render Identicon for first wallet in "to" array of objects', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const iconImage = (
        <Identicon
          diameter={32}
          address={msgParams.data.message.to[0].wallets[0]}
        />
      );
      expect(iconImage).toBeDefined();
    });

    it('should render first shorten address from wallets array if address does not exists in identities and address book objects', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams} />,
        store,
      );

      expect(getByText('0xbBb...BBbB')).toBeInTheDocument();
    });

    it('should render Identicon for second wallet in "to" array of objects', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const iconImage = (
        <Identicon
          diameter={32}
          address={msgParams.data.message.to[0].wallets[1]}
        />
      );
      expect(iconImage).toBeDefined();
    });

    it('should render second shorten address from wallets array if address does not exists in identities and address book objects', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams} />,
        store,
      );

      expect(getByText('0xB0B...Ea57')).toBeInTheDocument();
    });

    it('should render Identicon for third wallet in "to" array of objects', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const iconImage = (
        <Identicon
          diameter={32}
          address={msgParams.data.message.to[0].wallets[2]}
        />
      );
      expect(iconImage).toBeDefined();
    });

    it('should render third shorten address from wallets array if address does not exists in identities and address book objects', () => {
      const msgParams = {
        data: JSON.parse(JSON.stringify(messageData)),
        version: 'V4',
        origin: 'test',
      };
      const { getByText } = renderWithProvider(
        <SignatureRequestData data={msgParams} />,
        store,
      );

      expect(getByText('0xB0B...0000')).toBeInTheDocument();
    });
  });
});
