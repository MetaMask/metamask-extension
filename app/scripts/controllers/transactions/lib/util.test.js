import { strict as assert } from 'assert';
import * as txUtils from './util';

describe('txUtils', function () {
  describe('#validateTxParams', function () {
    it('does not throw for positive values', function () {
      const sample = {
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        to: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
        value: '0x01',
      };
      txUtils.validateTxParams(sample);
    });

    it('throws for invalid params value', function () {
      assert.throws(() => txUtils.validateTxParams(), {
        message: 'Invalid transaction params: must be an object.',
      });
      assert.throws(() => txUtils.validateTxParams(null), {
        message: 'Invalid transaction params: must be an object.',
      });
      assert.throws(() => txUtils.validateTxParams(true), {
        message: 'Invalid transaction params: must be an object.',
      });
      assert.throws(() => txUtils.validateTxParams([]), {
        message: 'Invalid transaction params: must be an object.',
      });
    });

    it('throws for missing "to" and "data"', function () {
      const sample = {
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        value: '0x01',
      };
      assert.throws(() => txUtils.validateTxParams(sample), {
        message:
          'Invalid transaction params: must specify "data" for contract deployments, or "to" (and optionally "data") for all other types of transactions.',
      });
    });

    it('throws for negative values', function () {
      const sample = {
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        to: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
        value: '-0x01',
      };
      assert.throws(() => txUtils.validateTxParams(sample), {
        message: 'Invalid transaction value "-0x01": not a positive number.',
      });
    });
  });

  describe('#normalizeTxParams', function () {
    it('should normalize txParams', function () {
      const txParams = {
        chainId: '0x1',
        from: 'a7df1beDBF813f57096dF77FCd515f0B3900e402',
        to: null,
        data: '68656c6c6f20776f726c64',
        random: 'hello world',
      };

      let normalizedTxParams = txUtils.normalizeTxParams(txParams);

      assert.ok(!normalizedTxParams.chainId, 'there should be no chainId');
      assert.ok(
        !normalizedTxParams.to,
        'there should be no to address if null',
      );
      assert.equal(
        normalizedTxParams.from.slice(0, 2),
        '0x',
        'from should be hex-prefixed',
      );
      assert.equal(
        normalizedTxParams.data.slice(0, 2),
        '0x',
        'data should be hex-prefixed',
      );
      assert.ok(
        !('random' in normalizedTxParams),
        'there should be no random key in normalizedTxParams',
      );

      txParams.to = 'a7df1beDBF813f57096dF77FCd515f0B3900e402';
      normalizedTxParams = txUtils.normalizeTxParams(txParams);
      assert.equal(
        normalizedTxParams.to.slice(0, 2),
        '0x',
        'to should be hex-prefixed',
      );
    });
  });

  describe('#validateRecipient', function () {
    it('removes recipient for txParams with 0x when contract data is provided', function () {
      const zeroRecipientDataTxParams = {
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        to: '0x',
        data: 'bytecode',
      };
      const sanitizedTxParams = txUtils.validateRecipient(
        zeroRecipientDataTxParams,
      );
      assert.deepEqual(
        sanitizedTxParams,
        {
          from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
          data: 'bytecode',
        },
        'no recipient with 0x',
      );
    });

    it('should error when recipient is 0x', function () {
      const zeroRecipientTxParams = {
        from: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        to: '0x',
      };
      assert.throws(
        () => {
          txUtils.validateRecipient(zeroRecipientTxParams);
        },
        Error,
        'Invalid recipient address',
      );
    });
  });

  describe('#validateFrom', function () {
    it('should error when from is not a hex string', function () {
      // where from is undefined
      const txParams = {};
      assert.throws(
        () => {
          txUtils.validateFrom(txParams);
        },
        Error,
        `Invalid from address ${txParams.from} not a string`,
      );

      // where from is array
      txParams.from = [];
      assert.throws(
        () => {
          txUtils.validateFrom(txParams);
        },
        Error,
        `Invalid from address ${txParams.from} not a string`,
      );

      // where from is a object
      txParams.from = {};
      assert.throws(
        () => {
          txUtils.validateFrom(txParams);
        },
        Error,
        `Invalid from address ${txParams.from} not a string`,
      );

      // where from is a invalid address
      txParams.from = 'im going to fail';
      assert.throws(
        () => {
          txUtils.validateFrom(txParams);
        },
        Error,
        `Invalid from address`,
      );

      // should run
      txParams.from = '0x1678a085c290ebd122dc42cba69373b5953b831d';
      txUtils.validateFrom(txParams);
    });
  });
});
