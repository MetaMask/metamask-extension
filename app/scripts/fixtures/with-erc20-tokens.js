import { CHAIN_IDS } from '../../../shared/constants/network';

export const FIXTURES_ERC20_TOKENS = {
  allTokens: {
    [CHAIN_IDS.MAINNET]: {
      myAccount: [
        {
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          symbol: 'DAI',
          decimals: 18,
        },
        {
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          symbol: 'USDC',
          decimals: 6,
        },
        {
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          symbol: 'USDT',
          decimals: 6,
        },
        {
          address: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
          symbol: 'SNX',
          decimals: 18,
        },
        {
          address: '0x111111111117dC0aa78b770fA6A738034120C302',
          symbol: '1INCH',
          decimals: 18,
        },
        {
          address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
          symbol: 'MATIC',
          decimals: 18,
        },
        {
          address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
          symbol: 'SHIB',
          decimals: 18,
        },
        {
          address: '0xFd09911130e6930Bf87F2B0554c44F400bD80D3e',
          symbol: 'ETHIX',
          decimals: 18,
        },
      ],
    },
    [CHAIN_IDS.OPTIMISM]: {
      myAccount: [
        {
          address: '0x76FB31fb4af56892A25e32cFC43De717950c9278',
          symbol: 'AAVE',
          decimals: 18,
        },
        {
          address: '0x4200000000000000000000000000000000000042',
          symbol: 'OP',
          decimals: 18,
        },
        {
          address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
          symbol: 'USDC.E',
          decimals: 6,
        },
        {
          address: '0x4200000000000000000000000000000000000006',
          symbol: 'WETH',
          decimals: 18,
        },
        {
          address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
          symbol: 'DAI',
          decimals: 18,
        },
        {
          address: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
          symbol: 'WSTETH',
          decimals: 18,
        },
        {
          address: '0x0994206dfE8De6Ec6920FF4D779B0d950605Fb53',
          symbol: 'CRV',
          decimals: 18,
        },
        {
          address: '0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6',
          symbol: 'LINK',
          decimals: 18,
        },
        {
          address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
          symbol: 'USDT',
          decimals: 6,
        },
        {
          address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
          symbol: 'WBTC',
          decimals: 8,
        },
      ],
    },
    [CHAIN_IDS.BASE]: {
      myAccount: [
        {
          address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          symbol: 'USDC',
          decimals: 6,
        },
        {
          address: '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452',
          symbol: 'wstETH',
          decimals: 18,
        },
        {
          address: '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c',
          symbol: 'WBTC',
          decimals: 8,
        },
        {
          address: '0x04c0599ae5a44757c0af6f9ec3b93da8976c150a',
          symbol: 'weETH.base',
          decimals: 18,
        },
        {
          address: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
          symbol: 'USDe',
          decimals: 18,
        },
        {
          address: '0x4200000000000000000000000000000000000006',
          symbol: 'WETH',
          decimals: 18,
        },
        {
          address: '0x820c137fa70c8691f0e44dc420a5e53c168921dc',
          symbol: 'USDS',
          decimals: 18,
        },
        {
          address: '0x8d010bf9c26881788b4e6bf5fd1bdc358c8f90b8',
          symbol: 'DOT',
          decimals: 18,
        },
        {
          address: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
          symbol: 'cbBTC',
          decimals: 8,
        },
        {
          address: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
          symbol: 'sUSDe',
          decimals: 18,
        },
      ],
    },
    [CHAIN_IDS.POLYGON]: {
      myAccount: [
        {
          address: '0xd6df932a45c0f255f85145f286ea0b292b21c90b',
          symbol: 'AAVE',
          decimals: 18,
        },
        {
          address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
          symbol: 'DAI',
          decimals: 18,
        },
        {
          address: '0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7',
          symbol: 'GHST',
          decimals: 18,
        },
        {
          address: '0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39',
          symbol: 'LINK',
          decimals: 18,
        },
        {
          address: '0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4',
          symbol: 'MANA',
          decimals: 18,
        },
        {
          address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
          symbol: 'WMATIC',
          decimals: 18,
        },
        {
          address: '0xb33eaad8d922b1083446dc23f610c2567fb5180f',
          symbol: 'UNI',
          decimals: 18,
        },
        {
          address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
          symbol: 'USDT',
          decimals: 6,
        },
        {
          address: '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
          symbol: 'WBTC',
          decimals: 8,
        },
        {
          address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
          symbol: 'WETH',
          decimals: 18,
        },
      ],
    },
    [CHAIN_IDS.BSC]: {
      myAccount: [
        {
          address: '0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd',
          symbol: 'LINK',
          decimals: 18,
        },
        {
          address: '0x715d400f88c167884bbcc41c5fea407ed4d2f8a0',
          symbol: 'AXS',
          decimals: 18,
        },
        {
          address: '0xa2b726b1145a4773f68593cf171187d8ebe4d495',
          symbol: 'INJ',
          decimals: 18,
        },
        {
          address: '0x947950bcc74888a40ffa2593c5798f11fc9124c4',
          symbol: 'SUSHI.BINANCE',
          decimals: 18,
        },
        {
          address: '0x47bead2563dcbf3bf2c9407fea4dc236faba485a',
          symbol: 'SXP',
          decimals: 18,
        },
        {
          address: '0xbf5140a22578168fd562dccf235e5d43a02ce9b1',
          symbol: 'UNI',
          decimals: 18,
        },
        {
          address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
          symbol: 'USDC',
          decimals: 18,
        },
        {
          address: '0x55d398326f99059ff775485246999027b3197955',
          symbol: 'USDT',
          decimals: 18,
        },
        {
          address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
          symbol: 'WBNB',
          decimals: 18,
        },
        {
          address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
          symbol: 'ETH',
          decimals: 18,
        },
      ],
    },
    [CHAIN_IDS.LINEA_MAINNET]: {
      myAccount: [
        {
          address: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff',
          symbol: 'USDC',
          decimals: 6,
        },
        {
          address: '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f',
          symbol: 'WETH',
          decimals: 18,
        },
        {
          address: '0x4af15ec2a0bd43db75dd04e62faa3b8ef36b00d5',
          symbol: 'DAI',
          decimals: 18,
        },
        {
          address: '0x93f4d0ab6a8b4271f4a28db399b5e30612d21116',
          symbol: 'STONE',
          decimals: 18,
        },
        {
          address: '0xa219439258ca9da29e9cc4ce5596924745e12b93',
          symbol: 'USDT',
          decimals: 6,
        },
        {
          address: '0x3aab2285ddcddad8edf438c1bab47e1a9d05a9b4',
          symbol: 'WBTC',
          decimals: 8,
        },
        {
          address: '0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f',
          symbol: 'WSTETH',
          decimals: 18,
        },
        {
          address: '0x1789e0043623282d5dcc7f213d703c6d8bafbb04',
          symbol: 'LINEA',
          decimals: 18,
        },
        {
          address: '0x5fbdf89403270a1846f5ae7d113a989f850d1566',
          symbol: 'FOXY',
          decimals: 18,
        },
        {
          address: '0x78354f8dccb269a615a7e0a24f9b0718fdc3c7a7',
          symbol: 'ZERO',
          decimals: 18,
        },
      ],
    },
    [CHAIN_IDS.ARBITRUM]: {
      myAccount: [
        {
          address: '0x354a6da3fcde098f8389cad84b0182725c6c91de',
          symbol: 'COMP',
          decimals: 18,
        },
        {
          address: '0x11cdb42b0eb46d95f990bedd4695a6e3fa034978',
          symbol: 'CRV',
          decimals: 18,
        },
        {
          address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
          symbol: 'DAI',
          decimals: 18,
        },
        {
          address: '0xf97f4df75117a78c1a5a0dbb814af92458539fb4',
          symbol: 'LINK',
          decimals: 18,
        },
        {
          address: '0x539bde0d7dbd336b79148aa742883198bbf60342',
          symbol: 'MAGIC',
          decimals: 18,
        },
        {
          address: '0x3e6648c5a70a150a88bce65f4ad4d506fe15d2af',
          symbol: 'SPELL',
          decimals: 18,
        },
        {
          address: '0xd4d42f0b6def4ce0383636770ef773390d85c61a',
          symbol: 'SUSHI',
          decimals: 18,
        },
        {
          address: '0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0',
          symbol: 'UNI',
          decimals: 18,
        },
        {
          address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
          symbol: 'USDC.E',
          decimals: 6,
        },
        {
          address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
          symbol: 'WBTC',
          decimals: 8,
        },
      ],
    },
    [CHAIN_IDS.AVALANCHE]: {
      myAccount: [
        {
          address: '0xc7198437980c041c805a1edcba50c1ce5db95118',
          symbol: 'USDT.E',
          decimals: 6,
        },
        {
          address: '0x50b7545627a5162f82a992c33b87adc75187b218',
          symbol: 'WBTC',
          decimals: 8,
        },
        {
          address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
          symbol: 'WAVAX',
          decimals: 18,
        },
        {
          address: '0xd586e7f844cea2f87f50152665bcbc2c279d8d70',
          symbol: 'DAI',
          decimals: 18,
        },
        {
          address: '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd',
          symbol: 'JOE',
          decimals: 18,
        },
        {
          address: '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab',
          symbol: 'WETH',
          decimals: 18,
        },
        {
          address: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
          symbol: 'USDC.E',
          decimals: 6,
        },
        {
          address: '0x5947bb275c521040051d82396192181b413227a3',
          symbol: 'LINK',
          decimals: 18,
        },
        {
          address: '0x63a72806098bd3d9520cc43356dd78afe5d386d9',
          symbol: 'AAVE',
          decimals: 18,
        },
        {
          address: '0xd24c2ad096400b6fbcd2ad8b24e7acbc21a1da64',
          symbol: 'FRAX',
          decimals: 18,
        },
      ],
    },
    [CHAIN_IDS.ZKSYNC_ERA]: {
      myAccount: [
        {
          address: '0x47260090ce5e83454d5f05a0abbb2c953835f777',
          symbol: 'SPACE',
          decimals: 18,
        },
        {
          address: '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4',
          symbol: 'USDC.E',
          decimals: 6,
        },
        {
          address: '0x5a7d6b2f92c77fad6ccabd7ee0624e64907eaf3e',
          symbol: 'ZK',
          decimals: 18,
        },
        {
          address: '0xbbeb516fb02a01611cbbe0453fe3c580d7281011',
          symbol: 'WBTC',
          decimals: 8,
        },
        {
          address: '0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4',
          symbol: 'USDC',
          decimals: 6,
        },
        {
          address: '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91',
          symbol: 'WETH',
          decimals: 18,
        },
        {
          address: '0x787c09494ec8bcb24dcaf8659e7d5d69979ee508',
          symbol: 'MAV',
          decimals: 18,
        },
        {
          address: '0x0e97c7a0f8b2c9885c8ac9fc6136e829cbc21d42',
          symbol: 'MUTE',
          decimals: 18,
        },
        {
          address: '0x2039bb4116b4efc145ec4f0e2ea75012d6c0f181',
          symbol: 'BUSD',
          decimals: 18,
        },
        {
          address: '0xdd9f72afed3631a6c85b5369d84875e6c42f1827',
          symbol: 'SIS',
          decimals: 18,
        },
      ],
    },
    [CHAIN_IDS.SEI]: {
      myAccount: [
        {
          address: '0x5cf6826140c1c56ff49c808a1a75407cd1df9423',
          symbol: 'ISEI',
          decimals: 6,
        },
        {
          address: '0xb75d0b03c06a926e488e2659df1a861f860bd3d1',
          symbol: 'KAVA USDT',
          decimals: 6,
        },
        {
          address: '0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7',
          symbol: 'WSEI',
          decimals: 18,
        },
        {
          address: '0xdd7d5e4ea2125d43c16eed8f1ffefffa2f4b4af6',
          symbol: 'JLY',
          decimals: 18,
        },
        {
          address: '0x059a6b0ba116c63191182a0956cf697d0d2213ec',
          symbol: 'SYUSD',
          decimals: 18,
        },
        {
          address: '0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392',
          symbol: 'USDC',
          decimals: 6,
        },
        {
          address: '0x51121bcae92e302f19d06c193c95e1f7b81a444b',
          symbol: 'YAKA',
          decimals: 18,
        },
        {
          address: '0x5f0e07dfee5832faa00c63f2d33a0d79150e8598',
          symbol: 'SEIYAN',
          decimals: 6,
        },
        {
          address: '0x37a4dd9ced2b19cfe8fac251cd727b5787e45269',
          symbol: 'FASTUSD',
          decimals: 18,
        },
        {
          address: '0x5bff88ca1442c2496f7e475e9e7786383bc070c0',
          symbol: 'SFRXUSD',
          decimals: 18,
        },
      ],
    },
  },
};
