import assert from 'assert';
import { getMethodName } from './confirm-transaction-base.component';

describe('ConfirmTransactionBase Component', function () {
  describe('getMethodName', function () {
    it('should get correct method names', function () {
      assert.strictEqual(getMethodName(undefined), '');
      assert.strictEqual(getMethodName({}), '');
      assert.strictEqual(getMethodName('confirm'), 'confirm');
      assert.strictEqual(getMethodName('balanceOf'), 'balance Of');
      assert.strictEqual(
        getMethodName('ethToTokenSwapInput'),
        'eth To Token Swap Input',
      );
    });
  });
});
