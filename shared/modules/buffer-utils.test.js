import { strict as assert } from 'assert';
import BN from 'bn.js';
import { toBuffer } from './buffer-utils';

describe('buffer utils', function () {
  describe('toBuffer', function () {
    it('should work with prefixed hex strings', function () {
      const result = toBuffer('0xe');
      assert.equal(result.length, 1);
    });

    it('should work with non prefixed hex strings', function () {
      const result = toBuffer('e');
      assert.equal(result.length, 1);
    });

    it('should work with weirdly 0x prefixed non-hex strings', function () {
      const result = toBuffer('0xtest');
      assert.equal(result.length, 6);
    });

    it('should work with regular strings', function () {
      const result = toBuffer('test');
      assert.equal(result.length, 4);
    });

    it('should work with BN', function () {
      const result = toBuffer(new BN(100));
      assert.equal(result.length, 1);
    });

    it('should work with Buffer', function () {
      const result = toBuffer(Buffer.from('test'));
      assert.equal(result.length, 4);
    });

    it('should work with a number', function () {
      const result = toBuffer(100);
      assert.equal(result.length, 1);
    });

    it('should work with null or undefined', function () {
      const result = toBuffer(null);
      const result2 = toBuffer(undefined);
      assert.equal(result.length, 0);
      assert.equal(result2.length, 0);
    });

    it('should work with UInt8Array', function () {
      const uint8 = new Uint8Array(2);
      const result = toBuffer(uint8);
      assert.equal(result.length, 2);
    });

    it('should work with objects that have a toBuffer property', function () {
      const result = toBuffer({
        toBuffer: () => Buffer.from('hi'),
      });
      assert.equal(result.length, 2);
    });

    it('should work with objects that have a toArray property', function () {
      const result = toBuffer({
        toArray: () => ['hi'],
      });
      assert.equal(result.length, 1);
    });
  });
});
