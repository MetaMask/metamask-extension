/* eslint-disable @typescript-eslint/naming-convention */
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_TRANSACTION_ID,
} from '../constants';
import {
  type EsploraTransaction,
  getRegtestAddressForFunding,
  getScriptPubKeyForAddress,
  getScripthashForAddress,
} from '../seeder/bitcoin/node';
import {
  buildBitcoinFixtureBlockchainState,
  buildBitcoinNodeOptions,
} from '../tests/btc/fixtures/with-bitcoin-fixtures';

describe('withBitcoinFixtures', () => {
  it('builds Bitcoin local node options from explicit account balances', () => {
    const secondAccount = 'bc1qzyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3h8ffkz';

    expect(
      buildBitcoinNodeOptions([
        {
          address: DEFAULT_BTC_ADDRESS,
          balance: 0.25,
        },
        {
          address: secondAccount,
        },
      ]),
    ).toStrictEqual({
      initialBalances: {
        [DEFAULT_BTC_ADDRESS]: 0.25,
        [secondAccount]: DEFAULT_BTC_BALANCE,
      },
    });
  });

  it('derives regtest funding addresses and script hashes from fixture accounts', () => {
    expect(getRegtestAddressForFunding(DEFAULT_BTC_ADDRESS)).toBe(
      'bcrt1qg6whd6pc0cguh6gpp3ewujm53hv32ta9lzr5cs',
    );
    expect(getScriptPubKeyForAddress(DEFAULT_BTC_ADDRESS)).toBe(
      '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5',
    );
    expect(getScripthashForAddress(DEFAULT_BTC_ADDRESS)).toBe(
      '538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721',
    );
  });

  it('indexes explicit transaction history by account script hash and txid', () => {
    const transaction = createBitcoinTransaction(DEFAULT_BTC_TRANSACTION_ID);
    const scripthash = getScripthashForAddress(DEFAULT_BTC_ADDRESS);

    const fixtureState = buildBitcoinFixtureBlockchainState([
      {
        address: DEFAULT_BTC_ADDRESS,
        balance: 0.5,
        transactions: [transaction],
      },
    ]);

    expect(
      fixtureState.transactionHistoryByScripthash?.get(scripthash),
    ).toStrictEqual([transaction]);
    expect(
      fixtureState.transactionsByTxid?.get(DEFAULT_BTC_TRANSACTION_ID),
    ).toBe(transaction);
  });

  it('allows empty transaction history to override local node history', () => {
    const scripthash = getScripthashForAddress(DEFAULT_BTC_ADDRESS);

    const fixtureState = buildBitcoinFixtureBlockchainState([
      {
        address: DEFAULT_BTC_ADDRESS,
        transactions: [],
      },
    ]);

    expect(
      fixtureState.transactionHistoryByScripthash?.get(scripthash),
    ).toStrictEqual([]);
  });
});

function createBitcoinTransaction(txid: string): EsploraTransaction {
  return {
    fee: 100,
    locktime: 0,
    size: 110,
    status: {
      block_hash:
        '000000000000000000013d73c3bd23225714f2fd8b801ed076818f2971897748',
      block_height: 102,
      block_time: 1768824955,
      confirmed: true,
    },
    txid,
    version: 2,
    vin: [],
    vout: [
      {
        scriptpubkey: '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5',
        scriptpubkey_address: DEFAULT_BTC_ADDRESS,
        scriptpubkey_asm:
          'OP_0 OP_PUSHBYTES_20 469d76e8387e11cbe9010c72ee4b748dd9152fa5',
        scriptpubkey_type: 'v0_p2wpkh',
        value: 50_000_000,
      },
    ],
    weight: 440,
  };
}
