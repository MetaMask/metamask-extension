/* eslint-disable @typescript-eslint/naming-convention */
import {
  BitcoinNode,
  bitcoinToSatoshis,
  createEsploraTransaction,
  scriptPubKeyToScriptHash,
  transactionTouchesScriptPubKey,
} from '../seeder/bitcoin/node';

describe('BitcoinNode helpers', () => {
  describe('bitcoinToSatoshis', () => {
    it('converts BTC values from bitcoind RPC responses to satoshis', () => {
      expect(bitcoinToSatoshis(1.23456789)).toBe(123456789);
    });
  });

  describe('scriptPubKeyToScriptHash', () => {
    it('returns the SHA-256 hash used by Esplora scripthash endpoints', () => {
      expect(
        scriptPubKeyToScriptHash(
          '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5',
        ),
      ).toBe(
        '538c172f4f5ff9c24693359c4cdc8ee4666565326a789d5e4b2df1db7acb4721',
      );
    });
  });

  describe('getBlockHash', () => {
    it('returns the mainnet genesis hash for height zero', async () => {
      await expect(new BitcoinNode().getBlockHash(0)).resolves.toBe(
        '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
      );
    });
  });

  describe('createEsploraTransaction', () => {
    it('maps bitcoind verbose transaction output to the Esplora transaction shape', () => {
      const transaction = createEsploraTransaction({
        blockhash: '0'.repeat(64),
        confirmations: 1,
        hash: '1'.repeat(64),
        hex: '02000000000100',
        locktime: 0,
        size: 110,
        time: 1710000000,
        txid: '2'.repeat(64),
        version: 2,
        vin: [
          {
            sequence: 4294967295,
            txid: '3'.repeat(64),
            vout: 0,
          },
        ],
        vout: [
          {
            n: 0,
            scriptPubKey: {
              address: 'bcrt1qg6whd6pc0cguh6gpp3ewujm53hv32ta9n4k6m7',
              asm: '0 469d76e8387e11cbe9010c72ee4b748dd9152fa5',
              hex: '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5',
              type: 'witness_v0_keyhash',
            },
            value: 0.25,
          },
        ],
        vsize: 82,
        weight: 328,
      });

      expect(transaction).toStrictEqual({
        fee: 0,
        locktime: 0,
        size: 110,
        status: {
          block_hash: '0'.repeat(64),
          block_time: 1710000000,
          confirmed: true,
        },
        txid: '2'.repeat(64),
        version: 2,
        vin: [
          {
            is_coinbase: false,
            prevout: null,
            scriptsig: '',
            scriptsig_asm: '',
            sequence: 4294967295,
            txid: '3'.repeat(64),
            vout: 0,
            witness: [],
          },
        ],
        vout: [
          {
            scriptpubkey: '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5',
            scriptpubkey_address: 'bc1qg6whd6pc0cguh6gpp3ewujm53hv32ta9hdp252',
            scriptpubkey_asm:
              'OP_0 OP_PUSHBYTES_20 469d76e8387e11cbe9010c72ee4b748dd9152fa5',
            scriptpubkey_type: 'v0_p2wpkh',
            value: 25000000,
          },
        ],
        weight: 328,
      });
    });

    it('maps configured mainnet addresses for multiple script public keys', () => {
      const secondScriptPubKey = '0014b179e3f9e3d08721eb3c159a4352612d5d66f19c';
      const transaction = createEsploraTransaction(
        {
          confirmations: 1,
          hash: '1'.repeat(64),
          hex: '02000000000100',
          locktime: 0,
          size: 110,
          txid: '2'.repeat(64),
          version: 2,
          vin: [],
          vout: [
            {
              n: 0,
              scriptPubKey: {
                address: 'bcrt1qk9u7870r6zrjr6euzkdyx5np94wkduvuj8e9fy',
                asm: '0 b179e3f9e3d08721eb3c159a4352612d5d66f19c',
                hex: secondScriptPubKey,
                type: 'witness_v0_keyhash',
              },
              value: 0.5,
            },
          ],
          vsize: 82,
          weight: 328,
        },
        {
          addressesByScriptPubKey: new Map([
            [secondScriptPubKey, 'bc1qk9u7870r6zrjr6euzkdyx5np94wkduvul0zmg7'],
          ]),
        },
      );

      expect(transaction.vout[0]?.scriptpubkey_address).toBe(
        'bc1qk9u7870r6zrjr6euzkdyx5np94wkduvul0zmg7',
      );
    });
  });

  describe('transactionTouchesScriptPubKey', () => {
    const accountOneScriptPubKey =
      '0014469d76e8387e11cbe9010c72ee4b748dd9152fa5';
    const accountTwoScriptPubKey =
      '0014b179e3f9e3d08721eb3c159a4352612d5d66f19c';

    it('matches a transaction that pays the account', () => {
      const transaction = createEsploraTransaction({
        confirmations: 0,
        hash: '1'.repeat(64),
        hex: '02000000000100',
        locktime: 0,
        size: 110,
        txid: '2'.repeat(64),
        version: 2,
        vin: [],
        vout: [
          {
            n: 0,
            scriptPubKey: {
              asm: `0 ${accountTwoScriptPubKey.slice(4)}`,
              hex: accountTwoScriptPubKey,
              type: 'witness_v0_keyhash',
            },
            value: 0.5,
          },
        ],
        vsize: 82,
        weight: 328,
      });

      expect(
        transactionTouchesScriptPubKey(transaction, accountTwoScriptPubKey),
      ).toBe(true);
      expect(
        transactionTouchesScriptPubKey(transaction, accountOneScriptPubKey),
      ).toBe(false);
    });

    it('matches a transaction that spends from the account', () => {
      const transaction = createEsploraTransaction(
        {
          confirmations: 0,
          hash: '1'.repeat(64),
          hex: '02000000000100',
          locktime: 0,
          size: 110,
          txid: '2'.repeat(64),
          version: 2,
          vin: [
            {
              sequence: 4294967295,
              txid: '3'.repeat(64),
              vout: 0,
            },
          ],
          vout: [],
          vsize: 82,
          weight: 328,
        },
        {
          prevouts: new Map([
            [
              `${'3'.repeat(64)}:0`,
              {
                scriptpubkey: accountTwoScriptPubKey,
                scriptpubkey_asm: `OP_0 OP_PUSHBYTES_20 ${accountTwoScriptPubKey.slice(
                  4,
                )}`,
                scriptpubkey_type: 'v0_p2wpkh',
                value: 50_000_000,
              },
            ],
          ]),
        },
      );

      expect(
        transactionTouchesScriptPubKey(transaction, accountTwoScriptPubKey),
      ).toBe(true);
      expect(
        transactionTouchesScriptPubKey(transaction, accountOneScriptPubKey),
      ).toBe(false);
    });
  });
});
