import { strict as assert } from 'assert';
import { TRANSACTION_ENVELOPE_TYPES } from '../../../../../shared/constants/transaction';
import { BURN_ADDRESS } from '../../../../../shared/modules/hexstring-utils';
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

    describe('when validating gasPrice', function () {
      it('should error when specifying incorrect type', function () {
        const txParams = {
          gasPrice: '0x1',
          type: TRANSACTION_ENVELOPE_TYPES.FEE_MARKET,
          to: BURN_ADDRESS,
        };

        assert.throws(
          () => {
            txUtils.validateTxParams(txParams);
          },
          {
            message: `Invalid transaction envelope type: specified type "0x2" but included a gasPrice instead of maxFeePerGas and maxPriorityFeePerGas`,
          },
        );
      });

      it('should error when gasPrice is not a string', function () {
        const txParams = {
          gasPrice: 1,
          to: BURN_ADDRESS,
        };

        assert.throws(
          () => {
            txUtils.validateTxParams(txParams);
          },
          {
            message:
              'Invalid transaction params: gasPrice is not a string. got: (1)',
          },
        );
      });

      it('should error when specifying maxFeePerGas', function () {
        const txParams = {
          gasPrice: '0x1',
          maxFeePerGas: '0x1',
          to: BURN_ADDRESS,
        };

        assert.throws(
          () => {
            txUtils.validateTxParams(txParams);
          },
          {
            message:
              'Invalid transaction params: specified gasPrice but also included maxFeePerGas, these cannot be mixed',
          },
        );
      });

      it('should error when specifying maxPriorityFeePerGas', function () {
        const txParams = {
          gasPrice: '0x1',
          maxPriorityFeePerGas: '0x1',
          to: BURN_ADDRESS,
        };

        assert.throws(
          () => {
            txUtils.validateTxParams(txParams);
          },
          {
            message:
              'Invalid transaction params: specified gasPrice but also included maxPriorityFeePerGas, these cannot be mixed',
          },
        );
      });

      it('should validate if gasPrice is set with no type or EIP-1559 gas fields', function () {
        const txParams = {
          gasPrice: '0x1',
          to: BURN_ADDRESS,
        };
        assert.doesNotThrow(() => txUtils.validateTxParams(txParams));
      });

      it('should validate if gasPrice is set with a type of "0x0"', function () {
        const txParams = {
          gasPrice: '0x1',
          type: TRANSACTION_ENVELOPE_TYPES.LEGACY,
          to: BURN_ADDRESS,
        };
        assert.doesNotThrow(() => txUtils.validateTxParams(txParams));
      });
    });

    describe('when validating maxFeePerGas', function () {
      it('should error when specifying incorrect type', function () {
        const txParams = {
          maxFeePerGas: '0x1',
          type: TRANSACTION_ENVELOPE_TYPES.LEGACY,
          to: BURN_ADDRESS,
        };

        assert.throws(
          () => {
            txUtils.validateTxParams(txParams);
          },
          {
            message:
              'Invalid transaction envelope type: specified type "0x0" but including maxFeePerGas and maxPriorityFeePerGas requires type: "0x2"',
          },
        );
      });

      it('should error when maxFeePerGas is not a string', function () {
        const txParams = {
          maxFeePerGas: 1,
          to: BURN_ADDRESS,
        };

        assert.throws(
          () => {
            txUtils.validateTxParams(txParams);
          },
          {
            message:
              'Invalid transaction params: maxFeePerGas is not a string. got: (1)',
          },
        );
      });

      it('should error when specifying gasPrice', function () {
        const txParams = {
          gasPrice: '0x1',
          maxFeePerGas: '0x1',
          to: BURN_ADDRESS,
        };

        assert.throws(
          () => {
            txUtils.validateTxParams(txParams);
          },
          {
            message:
              'Invalid transaction params: specified gasPrice but also included maxFeePerGas, these cannot be mixed',
          },
        );
      });

      it('should validate if maxFeePerGas is set with no type or gasPrice field', function () {
        const txParams = {
          maxFeePerGas: '0x1',
          to: BURN_ADDRESS,
        };
        assert.doesNotThrow(() => txUtils.validateTxParams(txParams));
      });

      it('should validate if maxFeePerGas is set with a type of "0x2"', function () {
        const txParams = {
          maxFeePerGas: '0x1',
          type: TRANSACTION_ENVELOPE_TYPES.FEE_MARKET,
          to: BURN_ADDRESS,
        };
        assert.doesNotThrow(() => txUtils.validateTxParams(txParams));
      });
    });

    describe('when validating maxPriorityFeePerGas', function () {
      it('should error when specifying incorrect type', function () {
        const txParams = {
          maxPriorityFeePerGas: '0x1',
          type: TRANSACTION_ENVELOPE_TYPES.LEGACY,
          to: BURN_ADDRESS,
        };

        assert.throws(
          () => {
            txUtils.validateTxParams(txParams);
          },
          {
            message:
              'Invalid transaction envelope type: specified type "0x0" but including maxFeePerGas and maxPriorityFeePerGas requires type: "0x2"',
          },
        );
      });

      it('should error when maxFeePerGas is not a string', function () {
        const txParams = {
          maxPriorityFeePerGas: 1,
          to: BURN_ADDRESS,
        };

        assert.throws(
          () => {
            txUtils.validateTxParams(txParams);
          },
          {
            message:
              'Invalid transaction params: maxPriorityFeePerGas is not a string. got: (1)',
          },
        );
      });

      it('should error when specifying gasPrice', function () {
        const txParams = {
          gasPrice: '0x1',
          maxPriorityFeePerGas: '0x1',
          to: BURN_ADDRESS,
        };

        assert.throws(
          () => {
            txUtils.validateTxParams(txParams);
          },
          {
            message:
              'Invalid transaction params: specified gasPrice but also included maxPriorityFeePerGas, these cannot be mixed',
          },
        );
      });

      it('should validate if maxPriorityFeePerGas is set with no type or gasPrice field', function () {
        const txParams = {
          maxPriorityFeePerGas: '0x1',
          to: BURN_ADDRESS,
        };
        assert.doesNotThrow(() => txUtils.validateTxParams(txParams));
      });

      it('should validate if maxPriorityFeePerGas is set with a type of "0x2"', function () {
        const txParams = {
          maxPriorityFeePerGas: '0x1',
          type: TRANSACTION_ENVELOPE_TYPES.FEE_MARKET,
          to: BURN_ADDRESS,
        };
        assert.doesNotThrow(() => txUtils.validateTxParams(txParams));
      });
    });

    describe('when validating EIP-1559 transactions', function () {
      it('should error when network does not support EIP-1559', function () {
        const txParams = {
          maxPriorityFeePerGas: '0x1',
          maxFeePerGas: '0x1',
          to: BURN_ADDRESS,
        };
        assert.throws(
          () => {
            txUtils.validateTxParams(txParams, false);
          },
          {
            message:
              'Invalid transaction params: params specify an EIP-1559 transaction but the current network does not support EIP-1559',
          },
        );
      });
      it('should validate when network does support EIP-1559', function () {
        const txParams = {
          maxPriorityFeePerGas: '0x1',
          maxFeePerGas: '0x1',
          to: BURN_ADDRESS,
        };
        assert.doesNotThrow(() => txUtils.validateTxParams(txParams, true));
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
        gasPrice: '1',
        maxFeePerGas: '1',
        maxPriorityFeePerGas: '1',
        type: '1',
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

      assert.equal(
        normalizedTxParams.gasPrice,
        '0x1',
        'gasPrice should be hex-prefixed',
      );

      assert.equal(
        normalizedTxParams.maxFeePerGas,
        '0x1',
        'maxFeePerGas should be hex-prefixed',
      );
      assert.equal(
        normalizedTxParams.maxPriorityFeePerGas,
        '0x1',
        'maxPriorityFeePerGas should be hex-prefixed',
      );
      assert.equal(
        normalizedTxParams.type,
        '0x1',
        'type should be hex-prefixed',
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
