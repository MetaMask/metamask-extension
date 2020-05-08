import assert from 'assert'
import migration43 from '../../../app/scripts/migrations/043'

const accountTokens = {
  '0xeb9e64b93097bc15f01f13eae97015c57ab64823': {},
  '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
    mainnet: [
      {
        address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
        decimals: 18,
        symbol: 'META',
      },
      {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        decimals: 18,
        symbol: 'DAI',
      },
    ],
  },
  '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
    ropsten: [
      {
        address: '0x1abc',
        decimals: 0,
        symbol: 'TST',
      },
    ],
  },
}

const tokens = [
  {
    address: '0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
    decimals: 18,
    symbol: 'META',
  },
  {
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    decimals: 18,
    symbol: 'DAI',
  },
]

const oldStorage = {
  meta: {
    version: 42,
  },
  data: {
    PreferencesController: {
      accountTokens,
      tokens,
    },
  },
}

const expectedStorage = {
  meta: {
    version: 43,
  },
  data: {
    PreferencesController: {},
    TokensController: {
      allTokens: {
        '0xeB9e64B93097bc15F01F13eae97015c57ab64823': {},
        '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc': {
          mainnet: [
            {
              address: '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4',
              decimals: 18,
              symbol: 'META',
            },
            {
              address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
              decimals: 18,
              symbol: 'DAI',
            },
          ],
        },
        '0xEC1Adf982415D2Ef5ec55899b9Bfb8BC0f29251B': {
          ropsten: [
            {
              address: '0x1ABc',
              decimals: 0,
              symbol: 'TST',
            },
          ],
        },
      },
      tokens: [
        {
          address: '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4',
          decimals: 18,
          symbol: 'META',
        },
        {
          address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          decimals: 18,
          symbol: 'DAI',
        },
      ],
    },
  },
}

describe('storage is migrated successfully', function () {
  it('should update the version metadata', function (done) {
    migration43.migrate(oldStorage)
      .then((newStorage) => {
        assert.equal(newStorage.meta.version, expectedStorage.meta.version)
        done()
      }).catch(done)
  })

  it('should move tokens from Preferences Controller to Token Controller while checksumming the account addresses and contract addresses', function (done) {
    migration43.migrate(oldStorage)
      .then((newStorage) => {
        assert.deepEqual(newStorage.data, expectedStorage.data)
        done()
      }).catch(done)
  })
})
