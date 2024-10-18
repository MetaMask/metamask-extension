import nock from 'nock';

const INFURA_API_KEY = 'INFURA_KEY';
const ADDRESS = 'ADDRESS';

export const createMockImplementation = <T,>(requests: Record<string, T>) => {
  return (method: string): Promise<T | undefined> => {
    if (method in requests) {
      return Promise.resolve(requests[method]);
    }
    return Promise.resolve(undefined);
  };
};

export function mockGetChains() {
  const mockEndpoint = nock('https://chainid.network', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/chains.json')
    .reply(200, [
      {
        name: 'Ethereum Mainnet',
        chain: 'ETH',
        icon: 'ethereum',
        rpc: [
          `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
          `wss://mainnet.infura.io/ws/v3/${INFURA_API_KEY}`,
          'https://api.mycryptoapi.com/eth',
          'https://cloudflare-eth.com',
          'https://ethereum-rpc.publicnode.com',
          'wss://ethereum-rpc.publicnode.com',
          'https://mainnet.gateway.tenderly.co',
          'wss://mainnet.gateway.tenderly.co',
          'https://rpc.blocknative.com/boost',
          'https://rpc.flashbots.net',
          'https://rpc.flashbots.net/fast',
          'https://rpc.mevblocker.io',
          'https://rpc.mevblocker.io/fast',
          'https://rpc.mevblocker.io/noreverts',
          'https://rpc.mevblocker.io/fullprivacy',
          'https://eth.drpc.org',
          'wss://eth.drpc.org',
        ],
        features: [
          {
            name: 'EIP155',
          },
          {
            name: 'EIP1559',
          },
        ],
        faucets: [],
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        infoURL: 'https://ethereum.org',
        shortName: 'eth',
        chainId: 1,
        networkId: 1,
        slip44: 60,
        ens: {
          registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        },
        explorers: [
          {
            name: 'etherscan',
            url: 'https://etherscan.io',
            standard: 'EIP3091',
          },
          {
            name: 'blockscout',
            url: 'https://eth.blockscout.com',
            icon: 'blockscout',
            standard: 'EIP3091',
          },
          {
            name: 'dexguru',
            url: 'https://ethereum.dex.guru',
            icon: 'dexguru',
            standard: 'EIP3091',
          },
        ],
      },
      {
        name: 'Goerli',
        title: 'Ethereum Testnet Goerli',
        chain: 'ETH',
        rpc: [
          `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
          `wss://goerli.infura.io/v3/${INFURA_API_KEY}`,
          'https://rpc.goerli.mudit.blog/',
          'https://ethereum-goerli-rpc.publicnode.com',
          'wss://ethereum-goerli-rpc.publicnode.com',
          'https://goerli.gateway.tenderly.co',
          'wss://goerli.gateway.tenderly.co',
        ],
        faucets: [
          `http://fauceth.komputing.org?chain=5&address=${ADDRESS}`,
          `https://goerli-faucet.slock.it?address=${ADDRESS}`,
          'https://faucet.goerli.mudit.blog',
        ],
        nativeCurrency: {
          name: 'Goerli Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        infoURL: 'https://goerli.net/#about',
        shortName: 'gor',
        chainId: 5,
        networkId: 5,
        slip44: 1,
        ens: {
          registry: '0x112234455c3a32fd11230c42e7bccd4a84e02010',
        },
        explorers: [
          {
            name: 'etherscan-goerli',
            url: 'https://goerli.etherscan.io',
            standard: 'EIP3091',
          },
          {
            name: 'blockscout-goerli',
            url: 'https://eth-goerli.blockscout.com',
            icon: 'blockscout',
            standard: 'EIP3091',
          },
        ],
      },
      {
        name: 'BNB Smart Chain Mainnet',
        chain: 'BSC',
        rpc: [
          'https://bsc-dataseed1.bnbchain.org',
          'https://bsc-dataseed2.bnbchain.org',
          'https://bsc-dataseed3.bnbchain.org',
          'https://bsc-dataseed4.bnbchain.org',
          'https://bsc-dataseed1.defibit.io',
          'https://bsc-dataseed2.defibit.io',
          'https://bsc-dataseed3.defibit.io',
          'https://bsc-dataseed4.defibit.io',
          'https://bsc-dataseed1.ninicoin.io',
          'https://bsc-dataseed2.ninicoin.io',
          'https://bsc-dataseed3.ninicoin.io',
          'https://bsc-dataseed4.ninicoin.io',
          'https://bsc-rpc.publicnode.com',
          'wss://bsc-rpc.publicnode.com',
          'wss://bsc-ws-node.nariox.org',
        ],
        faucets: [],
        nativeCurrency: {
          name: 'BNB Chain Native Token',
          symbol: 'BNB',
          decimals: 18,
        },
        infoURL: 'https://www.bnbchain.org/en',
        shortName: 'bnb',
        chainId: 56,
        networkId: 56,
        slip44: 714,
        explorers: [
          {
            name: 'bscscan',
            url: 'https://bscscan.com',
            standard: 'EIP3091',
          },
          {
            name: 'dexguru',
            url: 'https://bnb.dex.guru',
            icon: 'dexguru',
            standard: 'EIP3091',
          },
        ],
      },
      {
        name: 'Polygon Mainnet',
        chain: 'Polygon',
        icon: 'polygon',
        rpc: [
          'https://polygon-rpc.com/',
          'https://rpc-mainnet.matic.network',
          'https://matic-mainnet.chainstacklabs.com',
          'https://rpc-mainnet.maticvigil.com',
          'https://rpc-mainnet.matic.quiknode.pro',
          'https://matic-mainnet-full-rpc.bwarelabs.com',
          'https://polygon-bor-rpc.publicnode.com',
          'wss://polygon-bor-rpc.publicnode.com',
          'https://polygon.gateway.tenderly.co',
          'wss://polygon.gateway.tenderly.co',
          'https://polygon.drpc.org',
          'wss://polygon.drpc.org',
        ],
        faucets: [],
        nativeCurrency: {
          name: 'POL',
          symbol: 'POL',
          decimals: 18,
        },
        infoURL: 'https://polygon.technology/',
        shortName: 'pol',
        chainId: 137,
        networkId: 137,
        slip44: 966,
        explorers: [
          {
            name: 'polygonscan',
            url: 'https://polygonscan.com',
            standard: 'EIP3091',
          },
          {
            name: 'dexguru',
            url: 'https://polygon.dex.guru',
            icon: 'dexguru',
            standard: 'EIP3091',
          },
        ],
      },
      {
        name: 'Base',
        chain: 'ETH',
        rpc: [
          'https://mainnet.base.org/',
          'https://developer-access-mainnet.base.org/',
          'https://base.gateway.tenderly.co',
          'wss://base.gateway.tenderly.co',
          'https://base-rpc.publicnode.com',
          'wss://base-rpc.publicnode.com',
        ],
        faucets: [],
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        infoURL: 'https://base.org',
        shortName: 'base',
        chainId: 8453,
        networkId: 8453,
        icon: 'base',
        explorers: [
          {
            name: 'basescan',
            url: 'https://basescan.org',
            standard: 'none',
          },
          {
            name: 'basescout',
            url: 'https://base.blockscout.com',
            icon: 'blockscout',
            standard: 'EIP3091',
          },
          {
            name: 'dexguru',
            url: 'https://base.dex.guru',
            icon: 'dexguru',
            standard: 'EIP3091',
          },
        ],
        status: 'active',
      },
    ]);
  return mockEndpoint;
}

export function mock4byte(hexSignature: string, textSignature?: string) {
  const mockEndpoint = nock('https://www.4byte.directory:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/api/v1/signatures/')
    .query({ hex_signature: hexSignature })
    .reply(200, {
      results: [
        {
          id: 235447,
          created_at: '2021-09-14T02:07:09.805000Z',
          text_signature: textSignature ?? 'mintNFTs(uint256)',
          hex_signature: hexSignature,
          bytes_signature: ';K\u0013 ',
        },
      ],
    });
  return mockEndpoint;
}
