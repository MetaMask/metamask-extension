function setupAutoDetectMocking(server) {
  const nfts = {
    nfts: [
      {
        identifier:
          '86818186862637897590416402377730948900221574858925543698968316530334305793541',
        collection: 'ens',
        contract: '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
        token_standard: 'erc721',
        name: 'peteryinusa.eth',
        description: 'peteryinusa.eth, an ENS name.',
        image_url: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
        metadata_url:
          'https://metadata.ens.domains/mainnet/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/86818186862637897590416402377730948900221574858925543698968316530334305793541',
        opensea_url:
          'https://opensea.io/assets/ethereum/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/86818186862637897590416402377730948900221574858925543698968316530334305793541',
        created_at: ' ',
        updated_at: '2022-07-02T19:30:43.023572',
        is_disabled: false,
        is_nsfw: false,
      },
    ],
  };

  const nftContract = {
    address: '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
    chain: 'ethereum',
    collection: 'ens',
    contract_standard: 'erc721',
    name: 'Unidentified contract',
    supply: 0,
  };

  const nftCollection = {
    collection: 'ens',
    name: 'ENS: Ethereum Name Service',
    description:
      'Ethereum Name Service (ENS) domains are secure domain names for the decentralized world. ENS domains provide a way for users to map human readable names to blockchain and non-blockchain resources, like Ethereum addresses, IPFS hashes, or website URLs. ENS domains can be bought and sold on secondary markets.',
    image_url: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
    banner_image_url: '',
    owner: '0xfe89cc7abb2c4183683ab71653c4cdc9b02d44b7',
    safelist_status: 'verified',
    category: 'domain-names',
    is_disabled: false,
    is_nsfw: false,
    trait_offers_enabled: false,
    collection_offers_enabled: false,
    opensea_url: 'https://opensea.io/collection/ens',
    project_url: 'https://ens.domains',
    wiki_url: '',
    discord_url: '',
    telegram_url: '',
    twitter_username: 'ensdomains',
    instagram_username: '',
  };

  // Get assets for account
  server
    .forGet(
      'https://proxy.metafi.codefi.network/opensea/v1/api/v2/chain/ethereum/account/0x5cfe73b6021e818b776b421b1c4db2474086a7e1/nfts',
    )
    .withQuery({ limit: 200, next: '' })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: nfts,
      };
    });

  // Get contract
  server
    .forGet(
      'https://proxy.metafi.codefi.network/opensea/v1/api/v2/chain/ethereum/contract/0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: nftContract,
      };
    });

  // Get collection
  server
    .forGet(
      'https://proxy.metafi.codefi.network/opensea/v1/api/v2/collections/ens',
    )
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: nftCollection,
      };
    });

  // eth_blockNumber
  server
    .forPost('/v3/00000000000000000000000000000000')
    .withBodyIncluding('eth_blockNumber')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: 1111111111111111,
          result: '0x1',
        },
      };
    });

  // eth_getBlockByNumber
  server
    .forPost('/v3/00000000000000000000000000000000')
    .withBodyIncluding('eth_getBlockByNumber')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: 1111111111111111,
          result: {},
        },
      };
    });

  // eth_call
  server
    .forPost('/v3/00000000000000000000000000000000')
    .withBodyIncluding('eth_call')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          jsonrpc: '2.0',
          id: 1111111111111111,
          result: '0x1',
        },
      };
    });
}

module.exports = {
  setupAutoDetectMocking,
};
