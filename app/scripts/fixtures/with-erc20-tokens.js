const _TOKENS = [
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    decimals: 18,
    image:
      'https://static.metafi.codefi.network/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
    isERC721: false,
    aggregators: [],
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    decimals: 6,
    image:
      'https://static.metafi.codefi.network/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
    isERC721: false,
    aggregators: [],
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    decimals: 6,
    image:
      'https://static.metafi.codefi.network/api/v1/tokenIcons/1/0xdAC17F958D2ee523a2206206994597C13D831ec7.png',
    isERC721: false,
    aggregators: [],
  },
  {
    address: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
    symbol: 'SNX',
    decimals: 18,
    image:
      'https://static.metafi.codefi.network/api/v1/tokenIcons/1/0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F.png',
    isERC721: false,
    aggregators: [],
  },
  {
    address: '0x111111111117dC0aa78b770fA6A738034120C302',
    symbol: '1INCH',
    decimals: 18,
    image:
      'https://static.metafi.codefi.network/api/v1/tokenIcons/1/0x111111111117dC0aa78b770fA6A738034120C302.png',
    isERC721: false,
    aggregators: [],
  },
  {
    address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    symbol: 'MATIC',
    decimals: 18,
    image:
      'https://static.metafi.codefi.network/api/v1/tokenIcons/1/0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0.png',
    isERC721: false,
    aggregators: [],
  },
  {
    address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
    symbol: 'SHIB',
    decimals: 18,
    image:
      'https://static.metafi.codefi.network/api/v1/tokenIcons/1/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE.png',
    isERC721: false,
    aggregators: [],
  },
  {
    address: '0xFd09911130e6930Bf87F2B0554c44F400bD80D3e',
    symbol: 'ETHIX',
    decimals: 18,
    image:
      'https://static.metafi.codefi.network/api/v1/tokenIcons/1/0xFd09911130e6930Bf87F2B0554c44F400bD80D3e.png',
    isERC721: false,
    aggregators: [],
  },
];

export const FIXTURES_ERC20_TOKENS = {
  tokens: _TOKENS,
  ignoredTokens: [],
  detectedTokens: [],
  allTokens: {
    '0x1': {
      myAccount: _TOKENS,
    },
  },
  allIgnoredTokens: {},
  allDetectedTokens: {},
};
