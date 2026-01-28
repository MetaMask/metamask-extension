import { Readable } from 'stream';
import { ReadableStream as ReadableStreamWeb } from 'stream/web';
import { Mockttp, MockedEndpoint } from 'mockttp';

// Types
type PriceData = { price: number; marketCap: number };

/** Reference prices for common tokens */
const PRICES = {
  ETH: 3401.36,
  BTC: 95000,
  SOL: 150,
  BNB: 605,
  MATIC: 0.52,
  AVAX: 35.5,
  SEI: 0.45,
  STABLECOIN: 1.0,
} as const;

/**
 * Comprehensive price data for all chains and tokens in the power user fixture.
 * Organized by chain for easier maintenance.
 */
const POWER_USER_PRICES: Record<string, PriceData> = {
  // Native Tokens
  'eip155:1/slip44:60': { price: PRICES.ETH, marketCap: 400_000_000_000 }, // ETH Mainnet
  'eip155:59144/slip44:60': { price: PRICES.ETH, marketCap: 400_000_000_000 }, // Linea
  'eip155:42161/slip44:60': { price: PRICES.ETH, marketCap: 400_000_000_000 }, // Arbitrum
  'eip155:10/slip44:60': { price: PRICES.ETH, marketCap: 400_000_000_000 }, // Optimism
  'eip155:8453/slip44:60': { price: PRICES.ETH, marketCap: 400_000_000_000 }, // Base
  'eip155:324/slip44:60': { price: PRICES.ETH, marketCap: 400_000_000_000 }, // zkSync
  'eip155:137/slip44:60': { price: PRICES.MATIC, marketCap: 5_000_000_000 }, // Polygon
  'eip155:56/slip44:60': { price: PRICES.BNB, marketCap: 90_000_000_000 }, // BSC
  'eip155:43114/slip44:60': { price: PRICES.AVAX, marketCap: 14_000_000_000 }, // Avalanche
  'eip155:100/slip44:60': { price: PRICES.STABLECOIN, marketCap: 100_000_000 }, // Gnosis
  'eip155:1329/slip44:60': { price: PRICES.SEI, marketCap: 2_000_000_000 }, // Sei
  // Solana native token - various formats for matching
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
    price: PRICES.SOL,
    marketCap: 70_000_000_000,
  },
  'solana/slip44:501': { price: PRICES.SOL, marketCap: 70_000_000_000 },
  solana: { price: PRICES.SOL, marketCap: 70_000_000_000 },
  'bip122:000000000019d6689c085ae165831e93/slip44:0': {
    price: PRICES.BTC,
    marketCap: 1_800_000_000_000,
  },

  // Ethereum Mainnet (Chain 1) - ERC20 Tokens
  // Stablecoins (both cases for address matching)
  'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
    price: 1.0,
    marketCap: 50_000_000_000,
  }, // USDC
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
    price: 1.0,
    marketCap: 50_000_000_000,
  },
  'eip155:1/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA': {
    price: 0.9999,
    marketCap: 35_000_000_000,
  }, // MUSD
  'eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da': {
    price: 0.9999,
    marketCap: 35_000_000_000,
  },
  'eip155:1/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7': {
    price: 1.0,
    marketCap: 90_000_000_000,
  }, // USDT
  'eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7': {
    price: 1.0,
    marketCap: 90_000_000_000,
  },
  'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F': {
    price: 1.0,
    marketCap: 5_000_000_000,
  }, // DAI
  'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f': {
    price: 1.0,
    marketCap: 5_000_000_000,
  },
  // Other tokens
  'eip155:1/erc20:0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0': {
    price: 0.52,
    marketCap: 5_000_000_000,
  }, // MATIC
  'eip155:1/erc20:0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F': {
    price: 2.5,
    marketCap: 800_000_000,
  }, // SNX
  'eip155:1/erc20:0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE': {
    price: 0.000015,
    marketCap: 8_000_000_000,
  }, // SHIB
  'eip155:1/erc20:0xFd09911130e6930Bf87F2B0554c44F400bD80D3e': {
    price: 15,
    marketCap: 100_000_000,
  },

  // Polygon (Chain 137)
  'eip155:137/erc20:0xd6df932a45c0f255f85145f286ea0b292b21c90b': {
    price: 8,
    marketCap: 4_000_000_000,
  }, // AAVE
  'eip155:137/erc20:0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': {
    price: 1.0,
    marketCap: 500_000_000,
  }, // DAI
  'eip155:137/erc20:0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7': {
    price: 0.2,
    marketCap: 200_000_000,
  }, // GHST
  'eip155:137/erc20:0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4': {
    price: 0.4,
    marketCap: 100_000_000,
  }, // MANA
  'eip155:137/erc20:0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39': {
    price: 15,
    marketCap: 9_000_000_000,
  }, // LINK
  'eip155:137/erc20:0xb33eaad8d922b1083446dc23f610c2567fb5180f': {
    price: 10,
    marketCap: 6_000_000_000,
  }, // UNI
  'eip155:137/erc20:0xc2132d05d31c914a87c6611c10748aeb04b58e8f': {
    price: 1.0,
    marketCap: 90_000_000_000,
  }, // USDT
  'eip155:137/erc20:0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': {
    price: PRICES.BTC,
    marketCap: 1_800_000_000_000,
  }, // WBTC
  'eip155:137/erc20:0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': {
    price: PRICES.ETH,
    marketCap: 400_000_000_000,
  }, // WETH
  'eip155:137/erc20:0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': {
    price: 0.52,
    marketCap: 5_000_000_000,
  }, // WMATIC

  // Optimism (Chain 10)
  'eip155:10/erc20:0x76FB31fb4af56892A25e32cFC43De717950c9278': {
    price: 8,
    marketCap: 4_000_000_000,
  }, // AAVE
  'eip155:10/erc20:0x0994206dfE8De6Ec6920FF4D779B0d950605Fb53': {
    price: 1.5,
    marketCap: 300_000_000,
  }, // CRV
  'eip155:10/erc20:0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': {
    price: 1.0,
    marketCap: 5_000_000_000,
  }, // DAI
  'eip155:10/erc20:0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6': {
    price: 15,
    marketCap: 9_000_000_000,
  }, // LINK
  'eip155:10/erc20:0x4200000000000000000000000000000000000042': {
    price: 1.5,
    marketCap: 1_000_000_000,
  }, // OP
  'eip155:10/erc20:0x7F5c764cBc14f9669B88837ca1490cCa17c31607': {
    price: 1.0,
    marketCap: 50_000_000_000,
  }, // USDC
  'eip155:10/erc20:0x94b008aA00579c1307B0EF2c499aD98a8ce58e58': {
    price: 1.0,
    marketCap: 90_000_000_000,
  }, // USDT
  'eip155:10/erc20:0x68f180fcCe6836688e9084f035309E29Bf0A2095': {
    price: PRICES.BTC,
    marketCap: 1_800_000_000_000,
  }, // WBTC
  'eip155:10/erc20:0x4200000000000000000000000000000000000006': {
    price: PRICES.ETH,
    marketCap: 400_000_000_000,
  }, // WETH
  'eip155:10/erc20:0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb': {
    price: 2.5,
    marketCap: 300_000_000,
  }, // wstETH

  // Arbitrum (Chain 42161)
  'eip155:42161/erc20:0x354a6da3fcde098f8389cad84b0182725c6c91de': {
    price: 0.8,
    marketCap: 400_000_000,
  }, // COMP
  'eip155:42161/erc20:0x11cdb42b0eb46d95f990bedd4695a6e3fa034978': {
    price: 1.5,
    marketCap: 300_000_000,
  }, // CRV
  'eip155:42161/erc20:0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': {
    price: 1.0,
    marketCap: 5_000_000_000,
  }, // DAI
  'eip155:42161/erc20:0xf97f4df75117a78c1a5a0dbb814af92458539fb4': {
    price: 15,
    marketCap: 9_000_000_000,
  }, // LINK
  'eip155:42161/erc20:0x539bde0d7dbd336b79148aa742883198bbf60342': {
    price: 50,
    marketCap: 3_000_000_000,
  }, // MAGIC
  'eip155:42161/erc20:0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0': {
    price: 10,
    marketCap: 6_000_000_000,
  }, // UNI
  'eip155:42161/erc20:0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': {
    price: 1.0,
    marketCap: 50_000_000_000,
  }, // USDC
  'eip155:42161/erc20:0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f': {
    price: PRICES.BTC,
    marketCap: 1_800_000_000_000,
  }, // WBTC
  'eip155:42161/erc20:0x3e6648c5a70a150a88bce65f4ad4d506fe15d2af': {
    price: 2.5,
    marketCap: 100_000_000,
  }, // SPELL
  'eip155:42161/erc20:0xd4d42f0b6def4ce0383636770ef773390d85c61a': {
    price: 1.2,
    marketCap: 500_000_000,
  }, // SUSHI

  // Base (Chain 8453)
  'eip155:8453/erc20:0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf': {
    price: PRICES.BTC,
    marketCap: 1_800_000_000_000,
  }, // cbBTC
  'eip155:8453/erc20:0x8d010bf9c26881788b4e6bf5fd1bdc358c8f90b8': {
    price: 1.0,
    marketCap: 1_000_000_000,
  }, // cbUSD
  'eip155:8453/erc20:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': {
    price: 1.0,
    marketCap: 50_000_000_000,
  }, // USDC
  'eip155:8453/erc20:0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34': {
    price: 1.0,
    marketCap: 100_000_000,
  }, // EURC
  'eip155:8453/erc20:0x820c137fa70c8691f0e44dc420a5e53c168921dc': {
    price: 0.00001,
    marketCap: 50_000_000,
  }, // TOSHI
  'eip155:8453/erc20:0x0555E30da8f98308EdB960aa94C0Db47230d2B9c': {
    price: 0.00001,
    marketCap: 50_000_000,
  }, // BRETT
  'eip155:8453/erc20:0x04c0599ae5a44757c0af6f9ec3b93da8976c150a': {
    price: 0.00001,
    marketCap: 50_000_000,
  }, // BSWAP
  'eip155:8453/erc20:0x4200000000000000000000000000000000000006': {
    price: PRICES.ETH,
    marketCap: 400_000_000_000,
  }, // WETH
  'eip155:8453/erc20:0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452': {
    price: 2.5,
    marketCap: 300_000_000,
  }, // wstETH
  'eip155:8453/erc20:0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2': {
    price: 0.00001,
    marketCap: 10_000_000,
  }, // DEGEN

  // BSC (Chain 56)
  'eip155:56/erc20:0x715d400f88c167884bbcc41c5fea407ed4d2f8a0': {
    price: 5,
    marketCap: 300_000_000,
  }, // ALPACA
  'eip155:56/erc20:0x2170ed0880ac9a755fd29b2688956bd959f933f8': {
    price: PRICES.ETH,
    marketCap: 400_000_000_000,
  }, // ETH
  'eip155:56/erc20:0xa2b726b1145a4773f68593cf171187d8ebe4d495': {
    price: 0.1,
    marketCap: 100_000_000,
  }, // INJ
  'eip155:56/erc20:0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd': {
    price: 15,
    marketCap: 9_000_000_000,
  }, // LINK
  'eip155:56/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': {
    price: 1.0,
    marketCap: 50_000_000_000,
  }, // USDC
  'eip155:56/erc20:0x55d398326f99059ff775485246999027b3197955': {
    price: 1.0,
    marketCap: 90_000_000_000,
  }, // USDT
  'eip155:56/erc20:0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': {
    price: PRICES.BNB,
    marketCap: 90_000_000_000,
  }, // WBNB
  'eip155:56/erc20:0x947950bcc74888a40ffa2593c5798f11fc9124c4': {
    price: 200,
    marketCap: 2_000_000_000,
  }, // CAKE
  'eip155:56/erc20:0x47bead2563dcbf3bf2c9407fea4dc236faba485a': {
    price: 1.2,
    marketCap: 500_000_000,
  }, // SXP
  'eip155:56/erc20:0xbf5140a22578168fd562dccf235e5d43a02ce9b1': {
    price: 10,
    marketCap: 6_000_000_000,
  }, // UNI

  // Avalanche (Chain 43114)
  'eip155:43114/erc20:0x63a72806098bd3d9520cc43356dd78afe5d386d9': {
    price: 8,
    marketCap: 4_000_000_000,
  }, // AAVE
  'eip155:43114/erc20:0xd586e7f844cea2f87f50152665bcbc2c279d8d70': {
    price: 1.0,
    marketCap: 5_000_000_000,
  }, // DAI
  'eip155:43114/erc20:0xd24c2ad096400b6fbcd2ad8b24e7acbc21a1da64': {
    price: 0.3,
    marketCap: 100_000_000,
  }, // FRAX
  'eip155:43114/erc20:0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd': {
    price: 0.4,
    marketCap: 200_000_000,
  }, // JOE
  'eip155:43114/erc20:0x5947bb275c521040051d82396192181b413227a3': {
    price: 15,
    marketCap: 9_000_000_000,
  }, // LINK
  'eip155:43114/erc20:0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664': {
    price: 1.0,
    marketCap: 50_000_000_000,
  }, // USDC.e
  'eip155:43114/erc20:0xc7198437980c041c805a1edcba50c1ce5db95118': {
    price: 1.0,
    marketCap: 90_000_000_000,
  }, // USDT.e
  'eip155:43114/erc20:0x50b7545627a5162f82a992c33b87adc75187b218': {
    price: PRICES.BTC,
    marketCap: 1_800_000_000_000,
  }, // WBTC.e
  'eip155:43114/erc20:0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7': {
    price: PRICES.AVAX,
    marketCap: 14_000_000_000,
  }, // WAVAX
  'eip155:43114/erc20:0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab': {
    price: PRICES.ETH,
    marketCap: 400_000_000_000,
  }, // WETH.e

  // Linea (Chain 59144)
  'eip155:59144/erc20:0x4af15ec2a0bd43db75dd04e62faa3b8ef36b00d5': {
    price: 1.0,
    marketCap: 5_000_000_000,
  }, // DAI
  'eip155:59144/erc20:0x5fbdf89403270a1846f5ae7d113a989f850d1566': {
    price: 15,
    marketCap: 9_000_000_000,
  }, // LINK
  'eip155:59144/erc20:0x1789e0043623282d5dcc7f213d703c6d8bafbb04': {
    price: 1.5,
    marketCap: 300_000_000,
  }, // LXP
  'eip155:59144/erc20:0x93f4d0ab6a8b4271f4a28db399b5e30612d21116': {
    price: 100,
    marketCap: 1_000_000_000,
  }, // STONE
  'eip155:59144/erc20:0x176211869ca2b568f2a7d4ee941e073a821ee1ff': {
    price: 1.0,
    marketCap: 50_000_000_000,
  }, // USDC
  'eip155:59144/erc20:0xa219439258ca9da29e9cc4ce5596924745e12b93': {
    price: 1.0,
    marketCap: 90_000_000_000,
  }, // USDT
  'eip155:59144/erc20:0x3aab2285ddcddad8edf438c1bab47e1a9d05a9b4': {
    price: PRICES.BTC,
    marketCap: 1_800_000_000_000,
  }, // WBTC
  'eip155:59144/erc20:0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f': {
    price: PRICES.ETH,
    marketCap: 400_000_000_000,
  }, // WETH
  'eip155:59144/erc20:0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f': {
    price: 2.5,
    marketCap: 300_000_000,
  }, // wstETH
  'eip155:59144/erc20:0x78354f8dccb269a615a7e0a24f9b0718fdc3c7a7': {
    price: 0.5,
    marketCap: 100_000_000,
  }, // ZERO

  // zkSync (Chain 324)
  'eip155:324/erc20:0x2039bb4116b4efc145ec4f0e2ea75012d6c0f181': {
    price: 0.5,
    marketCap: 100_000_000,
  }, // ZK
  'eip155:324/erc20:0x787c09494ec8bcb24dcaf8659e7d5d69979ee508': {
    price: 1.0,
    marketCap: 5_000_000_000,
  }, // DAI
  'eip155:324/erc20:0x0e97c7a0f8b2c9885c8ac9fc6136e829cbc21d42': {
    price: 100,
    marketCap: 50_000_000,
  }, // HOLD
  'eip155:324/erc20:0xdd9f72afed3631a6c85b5369d84875e6c42f1827': {
    price: 15,
    marketCap: 9_000_000_000,
  }, // LINK
  'eip155:324/erc20:0x47260090ce5e83454d5f05a0abbb2c953835f777': {
    price: 1.2,
    marketCap: 200_000_000,
  }, // MUTE
  'eip155:324/erc20:0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4': {
    price: 1.0,
    marketCap: 50_000_000_000,
  }, // USDC
  'eip155:324/erc20:0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4': {
    price: 1.0,
    marketCap: 90_000_000_000,
  }, // USDC
  'eip155:324/erc20:0xbbeb516fb02a01611cbbe0453fe3c580d7281011': {
    price: PRICES.BTC,
    marketCap: 1_800_000_000_000,
  }, // WBTC
  'eip155:324/erc20:0x5aea5775959fbc2557cc8789bc1bf90a239d9a91': {
    price: PRICES.ETH,
    marketCap: 400_000_000_000,
  }, // WETH
  'eip155:324/erc20:0x5a7d6b2f92c77fad6ccabd7ee0624e64907eaf3e': {
    price: 0.3,
    marketCap: 50_000_000,
  }, // ZAT

  // Sei (Chain 1329)
  'eip155:1329/erc20:0x37a4dd9ced2b19cfe8fac251cd727b5787e45269': {
    price: PRICES.ETH,
    marketCap: 400_000_000_000,
  }, // WETH
  'eip155:1329/erc20:0x5cf6826140c1c56ff49c808a1a75407cd1df9423': {
    price: 1.0,
    marketCap: 50_000_000_000,
  }, // USDC
  'eip155:1329/erc20:0xdd7d5e4ea2125d43c16eed8f1ffefffa2f4b4af6': {
    price: 1.0,
    marketCap: 90_000_000_000,
  }, // USDT
  'eip155:1329/erc20:0xb75d0b03c06a926e488e2659df1a861f860bd3d1': {
    price: PRICES.SEI,
    marketCap: 2_000_000_000,
  }, // SEI
  'eip155:1329/erc20:0x5f0e07dfee5832faa00c63f2d33a0d79150e8598': {
    price: PRICES.BTC,
    marketCap: 1_800_000_000_000,
  }, // WBTC
  'eip155:1329/erc20:0x5bff88ca1442c2496f7e475e9e7786383bc070c0': {
    price: 2.5,
    marketCap: 200_000_000,
  }, // stSEI
  'eip155:1329/erc20:0x059a6b0ba116c63191182a0956cf697d0d2213ec': {
    price: 0.5,
    marketCap: 100_000_000,
  }, // SEIYAN
  'eip155:1329/erc20:0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392': {
    price: 0.8,
    marketCap: 150_000_000,
  }, // JLY
  'eip155:1329/erc20:0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7': {
    price: 0.05,
    marketCap: 50_000_000,
  }, // iSEI
  'eip155:1329/erc20:0x51121bcae92e302f19d06c193c95e1f7b81a444b': {
    price: 0.1,
    marketCap: 20_000_000,
  }, // DRAGON
};

/**
 * Creates a standard JSON-RPC success response
 *
 * @param result
 */
function jsonRpcResponse(result: unknown) {
  return {
    statusCode: 200,
    json: { jsonrpc: '2.0', id: 1, result },
  };
}

/** Builds fiat exchange rates response */
function buildFiatExchangeRates() {
  return {
    statusCode: 200,
    json: {
      usd: 1,
      eur: 0.92,
      gbp: 0.79,
      jpy: 149.5,
      cny: 7.24,
      krw: 1320,
      inr: 83.12,
      aud: 1.53,
      cad: 1.36,
      chf: 0.88,
    },
  };
}

/** Builds crypto exchange rates response */
function buildCryptoExchangeRates() {
  return {
    statusCode: 200,
    json: {
      eth: {
        name: 'Ether',
        ticker: 'eth',
        value: 1 / PRICES.ETH,
        currencyType: 'crypto',
      },
      usd: { name: 'US Dollar', ticker: 'usd', value: 1, currencyType: 'fiat' },
      btc: {
        name: 'Bitcoin',
        ticker: 'btc',
        value: 1 / PRICES.BTC,
        currencyType: 'crypto',
      },
      sol: {
        name: 'Solana',
        ticker: 'sol',
        value: 1 / PRICES.SOL,
        currencyType: 'crypto',
      },
    },
  };
}

/**
 * Builds full market data for a price
 *
 * @param assetId
 * @param price
 * @param marketCap
 */
function buildFullMarketData(
  assetId: string,
  price: number,
  marketCap: number,
) {
  return {
    id: assetId,
    price,
    marketCap,
    allTimeHigh: price * 1.5,
    allTimeLow: price * 0.1,
    totalVolume: marketCap * 0.1,
    high1d: price * 1.02,
    low1d: price * 0.98,
    circulatingSupply: marketCap / price,
    dilutedMarketCap: marketCap * 1.2,
    marketCapPercentChange1d: 2.5,
    priceChange1d: price * 0.025,
    pricePercentChange1h: 0.5,
    pricePercentChange1d: 2.5,
    pricePercentChange7d: 5.0,
    pricePercentChange14d: 8.0,
    pricePercentChange30d: 12.0,
    pricePercentChange200d: 50.0,
    pricePercentChange1y: 100.0,
  };
}

/**
 * Builds spot prices response from requested asset IDs
 *
 * @param url
 * @param priceMap
 */
function buildSpotPricesResponse(
  url: string,
  priceMap: Record<string, PriceData>,
): { statusCode: number; json: Record<string, unknown> } {
  try {
    const urlObj = new URL(url);
    const assetIdsParam = urlObj.searchParams.get('assetIds') || '';
    const includeMarketData =
      urlObj.searchParams.get('includeMarketData') === 'true';
    // Check if vsCurrency param is present - indicates v3 simple format expected
    const vsCurrency = urlObj.searchParams.get('vsCurrency');
    const assetIds = assetIdsParam
      .split(',')
      .map((id) => {
        try {
          return decodeURIComponent(id);
        } catch {
          return id;
        }
      })
      .filter((id) => id.length > 0);

    const prices: Record<string, unknown> = {};

    if (assetIds.length > 0) {
      for (const assetId of assetIds) {
        // Try multiple key formats for address case variations
        const priceData =
          priceMap[assetId] ||
          priceMap[assetId.toLowerCase()] ||
          priceMap[assetId.replace(/%3A/giu, ':').replace(/%2F/giu, '/')];

        const price = priceData?.price ?? 1.0;
        const marketCapVal = priceData?.marketCap ?? 1_000_000;

        // v3 simple format: { usd: number, usd_24h_change: number }
        if (vsCurrency) {
          prices[assetId] = includeMarketData
            ? buildFullMarketData(assetId, price, marketCapVal)
            : { [vsCurrency]: price, [`${vsCurrency}_24h_change`]: 2.5 };
        } else {
          prices[assetId] = includeMarketData
            ? buildFullMarketData(assetId, price, marketCapVal)
            : {
                id: assetId,
                price,
                marketCap: marketCapVal,
                pricePercentChange1d: 2.5,
              };
        }
      }
    } else {
      // Return all prices if no specific assets requested
      for (const [key, value] of Object.entries(priceMap)) {
        if (vsCurrency) {
          prices[key] = {
            [vsCurrency]: value.price,
            [`${vsCurrency}_24h_change`]: 2.5,
          };
        } else {
          prices[key] = includeMarketData
            ? buildFullMarketData(key, value.price, value.marketCap)
            : {
                id: key,
                price: value.price,
                marketCap: value.marketCap,
                pricePercentChange1d: 2.5,
              };
        }
      }
    }

    return { statusCode: 200, json: prices };
  } catch {
    // Fallback: return all prices
    const prices: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(priceMap)) {
      prices[key] = {
        id: key,
        price: value.price,
        marketCap: value.marketCap,
        pricePercentChange1d: 2.5,
      };
    }
    return { statusCode: 200, json: prices };
  }
}

/** Builds historical prices response for charts */
function buildHistoricalPricesResponse(): {
  statusCode: number;
  json: { prices: [number, number][] };
} {
  const now = Date.now();
  const prices: [number, number][] = [];
  for (let i = 0; i < 168; i++) {
    // 7 days of hourly data
    prices.push([now - i * 3600000, 1.0 + Math.random() * 0.02 - 0.01]);
  }
  return { statusCode: 200, json: { prices } };
}

/** SSE response header for getQuoteStream */
const SSE_RESPONSE_HEADER = { 'Content-Type': 'text/event-stream' };

/**
 * Creates an SSE event source stream from mock quotes
 *
 * @param index
 */
const getEventId = (index: number) => `${Date.now().toString()}-${index}`;
const emitLine = (controller: ReadableStreamDefaultController, line: string) =>
  controller.enqueue(Buffer.from(line));

/**
 * Mocks the bridge-api getQuoteStream endpoint's response body as SSE
 *
 * @param mockQuotes
 * @param delay
 */
export function mockSseEventSource(
  mockQuotes: unknown[],
  delay: number = 100,
): Readable {
  let index = 0;
  return Readable.fromWeb(
    new ReadableStreamWeb({
      async pull(controller) {
        const quote = mockQuotes[index];
        if (index === mockQuotes.length) {
          controller.close();
          return;
        }
        emitLine(controller, `event: quote\n`);
        emitLine(controller, `id: ${getEventId(index + 1)}\n`);
        emitLine(controller, `data: ${JSON.stringify(quote)}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        index += 1;
      },
    }),
  );
}

/** Default mock quote for swap (ETH to MUSD on mainnet - matches working bridge tests) */
const MOCK_SWAP_QUOTE = {
  quote: {
    requestId:
      '0xf75136205d474cdedb32d1c6f6811fe289b95678aa74679b9abb69252ed0b266',
    bridgeId: 'openocean',
    srcChainId: 1,
    destChainId: 1,
    aggregator: 'openocean',
    aggregatorType: 'AGG',
    srcAsset: {
      address: '0x0000000000000000000000000000000000000000',
      chainId: 1,
      assetId: 'eip155:1/slip44:60',
      symbol: 'ETH',
      decimals: 18,
      name: 'Ethereum',
      coingeckoId: 'ethereum',
      aggregators: [],
      occurrences: 100,
      iconUrl:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
      metadata: {},
    },
    srcTokenAmount: '1000000000000000000',
    destAsset: {
      address: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
      chainId: 1,
      assetId: 'eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da',
      symbol: 'MUSD',
      decimals: 6,
      name: 'MetaMask USD',
      coingeckoId: 'metamask-usd',
      aggregators: ['metamask', 'liFi', 'socket', 'rubic', 'rango'],
      occurrences: 5,
      iconUrl:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xaca92e438df0b2401ff60da7e4337b687a2435da.png',
      metadata: { storage: {} },
    },
    destTokenAmount: '3011431',
    minDestTokenAmount: '3759291202',
    walletAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    destWalletAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    feeData: {
      metabridge: {
        amount: '8750000000000000',
        asset: {
          address: '0x0000000000000000000000000000000000000000',
          chainId: 1,
          assetId: 'eip155:1/slip44:60',
          symbol: 'ETH',
          decimals: 18,
          name: 'Ethereum',
        },
        quoteBpsFee: 87.5,
        baseBpsFee: 87.5,
      },
    },
    bridges: ['openocean'],
    protocols: ['openocean'],
    steps: [],
    slippage: 2,
    priceData: {
      totalFromAmountUsd: '3400.00',
      totalToAmountUsd: '3400.00',
      priceImpact: '0.001',
      totalFeeAmountUsd: '30.00',
    },
  },
  approval: null,
  trade: {
    chainId: 1,
    to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
    from: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    value: '0xde0b6b3a7640000',
    data: '0x5f575529',
    gasLimit: 450000,
  },
  estimatedProcessingTimeInSeconds: 60,
};

/**
 * High-priority mocks for power user fixture tests.
 *
 * Uses asPriority(100) to ensure these mocks take precedence over default mocks.
 * Includes comprehensive price data for all tokens in the power user fixture.
 *
 * @param server
 */
export async function mockPowerUserPrices(
  server: Mockttp,
): Promise<MockedEndpoint[]> {
  const endpoints: MockedEndpoint[] = [];

  // Sentry error reporting
  endpoints.push(
    await server
      .forPost(/sentry\.io/u)
      .asPriority(150)
      .always()
      .thenCallback(() => ({ statusCode: 200, json: { success: true } })),
  );

  // Segment analytics
  endpoints.push(
    await server
      .forPost(/segment\.io/u)
      .asPriority(150)
      .always()
      .thenCallback(() => ({ statusCode: 200 })),
  );

  // Token API - tokens list
  endpoints.push(
    await server
      .forGet(/token\.api\.cx\.metamask\.io\/tokens/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({ statusCode: 200, json: [] })),
  );

  // DeFi adapters - positions
  endpoints.push(
    await server
      .forGet(/defiadapters\.api\.cx\.metamask\.io\/positions/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({ statusCode: 200, json: [] })),
  );

  // On-ramp content API
  endpoints.push(
    await server
      .forGet(/on-ramp-content\.api\.cx\.metamask\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({ statusCode: 200, json: { networks: [] } })),
  );

  // Accounts API - surveys
  endpoints.push(
    await server
      .forGet(/accounts\.api\.cx\.metamask\.io\/v1\/users\/.*\/surveys/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({ statusCode: 200, json: [] })),
  );

  // Chain ID network
  endpoints.push(
    await server
      .forGet(/chainid\.network\/chains\.json/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({ statusCode: 200, json: [] })),
  );

  // Phishing detection - stalelist
  endpoints.push(
    await server
      .forGet(/phishing-detection\.api\.cx\.metamask\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          blocklist: [],
          fuzzylist: [],
          allowlist: [],
          c2DomainBlocklist: [],
        },
      })),
  );

  // Client-side detection - request blocklist
  endpoints.push(
    await server
      .forGet(/client-side-detection\.api\.cx\.metamask\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({ statusCode: 200, json: [] })),
  );

  // NOTE: Authentication APIs (authentication.api.cx.metamask.io, oidc.api.cx.metamask.io)
  // are intentionally NOT mocked - they have complex response formats and should pass through

  // User storage API
  endpoints.push(
    await server
      .forGet(/user-storage\.api\.cx\.metamask\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({ statusCode: 200, json: null })),
  );

  // Subscription API
  endpoints.push(
    await server
      .forGet(/subscription\.api\.cx\.metamask\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: { subscriptions: [], trialedProducts: [] },
      })),
  );

  // Mainnet Infura RPC
  endpoints.push(
    await server
      .forPost(/mainnet\.infura\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => jsonRpcResponse('0x0')),
  );

  // Polygon Infura RPC
  endpoints.push(
    await server
      .forPost(/polygon-mainnet\.infura\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => jsonRpcResponse('0x0')),
  );

  // BSC Infura RPC
  endpoints.push(
    await server
      .forPost(/bsc-mainnet\.infura\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => jsonRpcResponse('0x0')),
  );

  // Optimism Infura RPC
  endpoints.push(
    await server
      .forPost(/optimism-mainnet\.infura\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => jsonRpcResponse('0x0')),
  );

  // Arbitrum Infura RPC
  endpoints.push(
    await server
      .forPost(/arbitrum-mainnet\.infura\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => jsonRpcResponse('0x0')),
  );

  // Base Infura RPC
  endpoints.push(
    await server
      .forPost(/base-mainnet\.infura\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => jsonRpcResponse('0x0')),
  );

  // Linea Infura RPC
  endpoints.push(
    await server
      .forPost(/linea-mainnet\.infura\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => jsonRpcResponse('0x0')),
  );

  // Avalanche Infura RPC
  endpoints.push(
    await server
      .forPost(/avalanche-mainnet\.infura\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => jsonRpcResponse('0x0')),
  );

  // Static assets (token icons)
  endpoints.push(
    await server
      .forGet(/static\.cx\.metamask\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        headers: { 'Content-Type': 'image/png' },
        body: Buffer.from([]),
      })),
  );

  // Exchange rates - fiat
  endpoints.push(
    await server
      .forGet(
        /https:\/\/price\.api\.cx\.metamask\.io\/v[1-9]\/exchange-rates\/fiat/u,
      )
      .asPriority(100)
      .always()
      .thenCallback(() => buildFiatExchangeRates()),
  );

  // Exchange rates - crypto
  endpoints.push(
    await server
      .forGet(
        /https:\/\/price\.api\.cx\.metamask\.io\/v[1-9]\/exchange-rates$/u,
      )
      .asPriority(100)
      .always()
      .thenCallback(() => buildCryptoExchangeRates()),
  );

  // Bitcoin spot prices (register before general spot-prices to take precedence)
  endpoints.push(
    await server
      .forGet(/price\.api\.cx\.metamask\.io\/v\d+\/spot-prices\/bitcoin/u)
      .asPriority(102)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: { bitcoin: { usd: PRICES.BTC } },
      })),
  );

  // Solana spot prices - path-based (register before general spot-prices to take precedence)
  endpoints.push(
    await server
      .forGet(/price\.api\.cx\.metamask\.io\/v\d+\/spot-prices\/solana/u)
      .asPriority(102)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: { solana: { usd: PRICES.SOL } },
      })),
  );

  // Solana spot prices - query-based (for assetIds containing solana:)
  endpoints.push(
    await server
      .forGet(/price\.api\.cx\.metamask\.io\/v\d+\/spot-prices\?.*solana/u)
      .asPriority(103)
      .always()
      .thenCallback((req) =>
        buildSpotPricesResponse(req.url, POWER_USER_PRICES),
      ),
  );

  // General spot prices (EVM tokens - uses query params, not path segments)
  // More permissive regex to catch all spot-prices requests with query params
  endpoints.push(
    await server
      .forGet(/price\.api\.cx\.metamask\.io\/v\d+\/spot-prices/u)
      .asPriority(101)
      .always()
      .thenCallback((req) =>
        buildSpotPricesResponse(req.url, POWER_USER_PRICES),
      ),
  );

  // Historical prices (for charts)
  endpoints.push(
    await server
      .forGet(
        /https:\/\/price\.api\.cx\.metamask\.io\/v[1-9]\/chains\/.*\/historical-prices/u,
      )
      .asPriority(100)
      .always()
      .thenCallback(() => buildHistoricalPricesResponse()),
  );

  // Cryptocompare API (for non-EVM rates)
  endpoints.push(
    await server
      .forGet(/^https:\/\/min-api\.cryptocompare\.com\/data\/pricemulti/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          BTC: { USD: PRICES.BTC },
          SOL: { USD: PRICES.SOL },
          ETH: { USD: PRICES.ETH },
        },
      })),
  );

  // Cryptocompare single price API (alternative endpoint)
  endpoints.push(
    await server
      .forGet(/^https:\/\/min-api\.cryptocompare\.com\/data\/price/u)
      .asPriority(100)
      .always()
      .thenCallback((req) => {
        const url = req.url.toLowerCase();
        if (url.includes('fsym=sol')) {
          return { statusCode: 200, json: { USD: PRICES.SOL } };
        }
        if (url.includes('fsym=btc')) {
          return { statusCode: 200, json: { USD: PRICES.BTC } };
        }
        return { statusCode: 200, json: { USD: PRICES.ETH } };
      }),
  );

  endpoints.push(
    await server
      .forGet('https://acl.execution.metamask.io/latest/registry.json')
      .asPriority(100)
      .always()
      .thenCallback(() => ({ statusCode: 200, json: { registry: {} } })),
  );

  endpoints.push(
    await server
      .forGet('https://acl.execution.metamask.io/latest/signature.json')
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: { signature: 'mock-signature' },
      })),
  );

  // Celo Mainnet (via Infura)
  endpoints.push(
    await server
      .forPost(/https:\/\/celo-mainnet\.infura\.io\/v3\/.*/u)
      .asPriority(100)
      .always()
      .thenCallback(() => jsonRpcResponse('0x0')),
  );

  // Gnosis Chain RPC
  endpoints.push(
    await server
      .forPost('https://rpc.gnosischain.com/')
      .asPriority(100)
      .always()
      .thenCallback(() => jsonRpcResponse('0x0')),
  );

  // Solana RPC (via Infura) - HIGH PRIORITY
  // 1 SOL = 1,000,000,000 lamports, giving 50 SOL for tests
  const SOL_BALANCE_LAMPORTS = 50_000_000_000;
  const SOLANA_URL_REGEX = /^https:\/\/solana-mainnet\.infura\.io\/v3\/.*/u;

  // Solana getBalance - specific method mock
  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getBalance' })
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: {
            context: { apiVersion: '2.0.18', slot: 308460925 },
            value: SOL_BALANCE_LAMPORTS,
          },
        },
      })),
  );

  // Solana getAccountInfo
  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getAccountInfo' })
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: {
            context: { apiVersion: '2.0.21', slot: 317161313 },
            value: {
              data: ['', 'base58'],
              executable: false,
              lamports: SOL_BALANCE_LAMPORTS,
              owner: '11111111111111111111111111111111',
              rentEpoch: Number.MAX_SAFE_INTEGER,
              space: 0,
            },
          },
        },
      })),
  );

  // Solana getLatestBlockhash
  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getLatestBlockhash' })
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: {
            context: { apiVersion: '2.0.18', slot: 308460925 },
            value: {
              blockhash: '6E9FiVcuvavWyKTfYC7N9ezJWkNgJVQsroDTHvqApncg',
              lastValidBlockHeight: 341034515,
            },
          },
        },
      })),
  );

  // Solana getFeeForMessage
  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getFeeForMessage' })
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: { context: { slot: 5068 }, value: 5000 },
        },
      })),
  );

  // Solana getMinimumBalanceForRentExemption
  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getMinimumBalanceForRentExemption' })
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: 890880, // minimum balance for rent exemption
        },
      })),
  );

  // Solana getTokenAccountsByOwner - return empty for simplicity
  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getTokenAccountsByOwner' })
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: {
            context: { slot: 137568828 },
            value: [],
          },
        },
      })),
  );

  // Solana simulateTransaction
  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'simulateTransaction' })
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: {
            context: { apiVersion: '2.0.21', slot: 318191894 },
            value: {
              accounts: null,
              err: null,
              innerInstructions: null,
              logs: [
                'Program 11111111111111111111111111111111 invoke [1]',
                'Program 11111111111111111111111111111111 success',
              ],
              replacementBlockhash: {
                blockhash: '2xWVC3snr4U29m8Rhio9HMmPaYNAQPrRn1bXjB1BJFuM',
                lastValidBlockHeight: 296475563,
              },
              returnData: null,
              unitsConsumed: 150,
            },
          },
        },
      })),
  );

  // Solana getSignaturesForAddress - return empty
  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .withJsonBodyIncluding({ method: 'getSignaturesForAddress' })
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: [],
        },
      })),
  );

  // Solana catch-all for other methods (lowest priority among Solana mocks)
  endpoints.push(
    await server
      .forPost(SOLANA_URL_REGEX)
      .asPriority(99)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: { context: { slot: 250000000 }, value: null },
        },
      })),
  );

  // Bridge getTokens/popular endpoint (POST request)
  endpoints.push(
    await server
      .forPost(/getTokens\/popular/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: [
          {
            address: '0x0000000000000000000000000000000000000000',
            chainId: 'eip155:1',
            assetId: 'eip155:1/slip44:60',
            symbol: 'ETH',
            decimals: 18,
            name: 'Ethereum',
            aggregators: [],
            occurrences: 100,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
            metadata: {},
          },
          {
            address: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
            chainId: 'eip155:1',
            assetId:
              'eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da',
            symbol: 'MUSD',
            decimals: 6,
            name: 'MetaMask USD',
            aggregators: ['metamask', 'liFi', 'socket', 'rubic', 'rango'],
            occurrences: 5,
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xaca92e438df0b2401ff60da7e4337b687a2435da.png',
            metadata: { storage: {} },
          },
          {
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            chainId: 'eip155:1',
            assetId:
              'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: 6,
            name: 'USD Coin',
            aggregators: [],
            occurrences: 100,
            iconUrl:
              'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
            metadata: {},
          },
          {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            chainId: 'eip155:1',
            assetId:
              'eip155:1/erc20:0xdac17f958d2ee523a2206206994597c13d831ec7',
            symbol: 'USDT',
            decimals: 6,
            name: 'Tether USD',
            aggregators: [],
            occurrences: 100,
            iconUrl:
              'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
            metadata: {},
          },
        ],
      })),
  );

  // Bridge getTokens/search endpoint (POST request)
  endpoints.push(
    await server
      .forPost(/getTokens\/search/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          data: [
            {
              address: '0x0000000000000000000000000000000000000000',
              chainId: 'eip155:1',
              assetId: 'eip155:1/slip44:60',
              symbol: 'ETH',
              decimals: 18,
              name: 'Ethereum',
            },
            {
              address: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
              chainId: 'eip155:1',
              assetId:
                'eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da',
              symbol: 'MUSD',
              decimals: 6,
              name: 'MetaMask USD',
            },
            {
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              chainId: 'eip155:1',
              assetId:
                'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              symbol: 'USDC',
              decimals: 6,
              name: 'USD Coin',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null,
          },
        },
      })),
  );

  // Bridge getTokens endpoint (GET request with chainId query)
  endpoints.push(
    await server
      .forGet(/getTokens/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: [
          {
            address: '0x0000000000000000000000000000000000000000',
            chainId: 1,
            symbol: 'ETH',
            decimals: 18,
            name: 'Ethereum',
            iconUrl:
              'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
          },
          {
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            chainId: 1,
            symbol: 'USDC',
            decimals: 6,
            name: 'USD Coin',
            iconUrl:
              'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
          },
        ],
      })),
  );

  // Bridge getQuote endpoint - return a mock quote
  endpoints.push(
    await server
      .forGet(/getQuote/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: [
          {
            quote: {
              requestId: '0xmock-request-id-123456789',
              bridgeId: 'lifi',
              srcChainId: 1,
              destChainId: 1,
              aggregator: 'lifi',
              aggregatorType: 'AGG',
              srcAsset: {
                address: '0x0000000000000000000000000000000000000000',
                chainId: 1,
                assetId: 'eip155:1/slip44:60',
                symbol: 'ETH',
                decimals: 18,
                name: 'Ethereum',
                coingeckoId: 'ethereum',
                aggregators: [],
                occurrences: 100,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
                metadata: {},
              },
              srcTokenAmount: '1000000000000000000',
              destAsset: {
                address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                chainId: 1,
                assetId:
                  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                symbol: 'USDC',
                decimals: 6,
                name: 'USD Coin',
                coingeckoId: 'usd-coin',
                aggregators: [],
                occurrences: 100,
                iconUrl:
                  'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
                metadata: {},
              },
              destTokenAmount: '3400000000',
              minDestTokenAmount: '3332000000',
              walletAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
              destWalletAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
              feeData: {
                metabridge: {
                  amount: '8750000000000000',
                  asset: {
                    address: '0x0000000000000000000000000000000000000000',
                    chainId: 1,
                    assetId: 'eip155:1/slip44:60',
                    symbol: 'ETH',
                    decimals: 18,
                    name: 'Ethereum',
                    coingeckoId: 'ethereum',
                    aggregators: [],
                    occurrences: 100,
                    iconUrl:
                      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
                    metadata: {},
                  },
                  quoteBpsFee: 87.5,
                  baseBpsFee: 87.5,
                },
              },
              bridges: ['lifi'],
              protocols: ['lifi'],
              steps: [],
              slippage: 2,
              priceData: {
                totalFromAmountUsd: '3400.00',
                totalToAmountUsd: '3400.00',
                priceImpact: '0.001',
                totalFeeAmountUsd: '30.00',
              },
            },
            approval: null,
            trade: {
              chainId: 1,
              to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
              from: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
              value: '0xde0b6b3a7640000',
              data: '0x5f575529',
              gasLimit: 450000,
            },
            estimatedProcessingTimeInSeconds: 60,
          },
        ],
      })),
  );

  // Catch-all for bridge.api requests to see what's being called
  endpoints.push(
    await server
      .forGet(/bridge\.api\.cx\.metamask\.io/u)
      .asPriority(50)
      .always()
      .thenCallback(() => ({ statusCode: 200, json: [] })),
  );

  // Bridge getQuoteStream endpoint (SSE) - generic handler for any swap
  // Log every request to debug
  endpoints.push(
    await server
      .forGet(/bridge\.api\.cx\.metamask\.io.*getQuoteStream/u)
      .asPriority(200)
      .always()
      .thenCallback(() => {
        const sseData = `event: quote\nid: ${Date.now()}-1\ndata: ${JSON.stringify(MOCK_SWAP_QUOTE)}\n\n`;
        return {
          statusCode: 200,
          headers: SSE_RESPONSE_HEADER,
          rawBody: Buffer.from(sseData),
        };
      }),
  );

  // Bridge feature flags endpoint
  endpoints.push(
    await server
      .forGet(/getAllFeatureFlags/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          'extension-config': {
            refreshRate: 30000,
            maxRefreshCount: 5,
            support: true,
            chains: {
              '1': { isActiveSrc: true, isActiveDest: true },
              '10': { isActiveSrc: true, isActiveDest: true },
              '137': { isActiveSrc: true, isActiveDest: true },
              '42161': { isActiveSrc: true, isActiveDest: true },
              '8453': { isActiveSrc: true, isActiveDest: true },
              '59144': { isActiveSrc: true, isActiveDest: true },
            },
          },
        },
      })),
  );

  // Client config feature flags endpoint - MUST include sse.enabled: true for getQuoteStream to be used
  endpoints.push(
    await server
      .forGet(/client-config\.api\.cx\.metamask\.io\/v1\/flags/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: [
          {
            bridgeConfig: {
              refreshRate: 30000,
              maxRefreshCount: 5,
              support: true,
              sse: {
                enabled: true,
                minimumVersion: '13.2.0',
              },
              chains: {
                '1': { isActiveSrc: true, isActiveDest: true },
                '10': { isActiveSrc: true, isActiveDest: true },
                '137': { isActiveSrc: true, isActiveDest: true },
                '42161': { isActiveSrc: true, isActiveDest: true },
                '8453': { isActiveSrc: true, isActiveDest: true },
                '59144': { isActiveSrc: true, isActiveDest: true },
              },
            },
          },
        ],
      })),
  );

  // Security alerts API for swap
  endpoints.push(
    await server
      .forPost(/https:\/\/security-alerts\.api\.cx\.metamask\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          resultType: 'Benign',
          reason: '',
          description: '',
          features: [],
        },
      })),
  );

  // Gas API - suggestedGasFees
  endpoints.push(
    await server
      .forGet(/gas\.api\.cx\.metamask\.io\/networks\/\d+\/suggestedGasFees/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          low: {
            suggestedMaxPriorityFeePerGas: '0.05',
            suggestedMaxFeePerGas: '15',
            minWaitTimeEstimate: 15000,
            maxWaitTimeEstimate: 30000,
          },
          medium: {
            suggestedMaxPriorityFeePerGas: '0.1',
            suggestedMaxFeePerGas: '20',
            minWaitTimeEstimate: 10000,
            maxWaitTimeEstimate: 20000,
          },
          high: {
            suggestedMaxPriorityFeePerGas: '0.2',
            suggestedMaxFeePerGas: '25',
            minWaitTimeEstimate: 5000,
            maxWaitTimeEstimate: 10000,
          },
          estimatedBaseFee: '14',
          networkCongestion: 0.5,
          latestPriorityFeeRange: ['0.01', '1'],
          historicalPriorityFeeRange: ['0.01', '5'],
          historicalBaseFeeRange: ['10', '20'],
          priorityFeeTrend: 'up',
          baseFeeTrend: 'down',
        },
      })),
  );

  // Gas API - gasPrices
  endpoints.push(
    await server
      .forGet(/gas\.api\.cx\.metamask\.io\/networks\/\d+\/gasPrices/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          SafeGasPrice: '30',
          ProposeGasPrice: '30',
          FastGasPrice: '30',
        },
      })),
  );

  // Top assets for all networks
  endpoints.push(
    await server
      .forGet(/\/topAssets/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: [
          {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
          },
          {
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            symbol: 'USDC',
          },
          {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            symbol: 'USDT',
          },
          {
            address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            symbol: 'DAI',
          },
        ],
      })),
  );

  // Aggregator metadata for all networks
  endpoints.push(
    await server
      .forGet(/\/aggregatorMetadata/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          lifi: {
            title: 'LiFi',
            icon: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
          },
          socket: {
            title: 'Socket',
            icon: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
          },
        },
      })),
  );

  // Network tokens endpoint (bridge.api tokens)
  endpoints.push(
    await server
      .forGet(/bridge\.api\.cx\.metamask\.io\/networks\/\d+\/tokens/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: [
          {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            name: 'Ethereum',
          },
          {
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            symbol: 'USDC',
            decimals: 6,
            name: 'USD Coin',
          },
          {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            symbol: 'USDT',
            decimals: 6,
            name: 'Tether USD',
          },
        ],
      })),
  );

  // Portfolio page mock
  endpoints.push(
    await server
      .forGet(/portfolio\.metamask\.io/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        body: '<!DOCTYPE html><html><body>Portfolio</body></html>',
      })),
  );

  // Accounts transactions
  endpoints.push(
    await server
      .forGet(
        /accounts\.api\.cx\.metamask\.io\/v1\/accounts\/.*\/transactions/u,
      )
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          transactions: [],
          pagination: {
            next: null,
            prev: null,
          },
        },
      })),
  );

  // Accounts balances
  endpoints.push(
    await server
      .forGet(/accounts\.api\.cx\.metamask\.io\/v1\/accounts\/.*\/balances/u)
      .asPriority(100)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          balances: [
            {
              address: '0x0000000000000000000000000000000000000000',
              balance: '1000000000000000000',
            },
          ],
        },
      })),
  );

  return endpoints;
}
