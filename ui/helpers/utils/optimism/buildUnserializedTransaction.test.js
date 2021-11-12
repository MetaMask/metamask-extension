import { BN } from 'ethereumjs-util';
import { times } from 'lodash';
import buildUnserializedTransaction from './buildUnserializedTransaction';

describe('buildUnserializedTransaction', () => {
  it('returns a transaction that can be serialized and fed to an Optimism smart contract', () => {
    const unserializedTransaction = buildUnserializedTransaction({
      txParams: {
        nonce: '0x0',
        gasPrice: `0x${new BN('100').toString(16)}`,
        gas: `0x${new BN('21000').toString(16)}`,
        to: '0x0000000000000000000000000000000000000000',
        value: `0x${new BN('10000000000000').toString(16)}`,
        data: '0x0',
      },
    });
    expect(unserializedTransaction).toMatchObject({
      nonce: new BN('00', 16),
      gasPrice: new BN('64', 16),
      gasLimit: new BN('5208', 16),
      to: expect.objectContaining({
        buf: Buffer.from(times(20, 0)),
      }),
      value: new BN('09184e72a000', 16),
      data: Buffer.from([0]),
    });
  });
});
