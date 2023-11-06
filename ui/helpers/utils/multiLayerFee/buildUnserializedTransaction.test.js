import { BN } from 'ethereumjs-util';
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
    expect(unserializedTransaction.toJSON()).toMatchObject({
      nonce: '0x0',
      gasPrice: '0x64',
      gasLimit: '0x5208',
      to: '0x0000000000000000000000000000000000000000',
      value: '0x9184e72a000',
      data: '0x00',
    });
  });
});
