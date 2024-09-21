import 'fake-indexeddb/auto';

import { IndexedDBPPOMStorage } from './indexed-db-backend';

Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      digest: () => new ArrayBuffer(12),
    },
  },
});

const enc = new TextEncoder();
const dec = new TextDecoder('utf-8');

describe('IndexedDBPPOMStorage', () => {
  it('should be able to initialise correctly', () => {
    const indexDBBackend = new IndexedDBPPOMStorage('PPOMDB', 1);
    expect(indexDBBackend).toBeDefined();
  });

  it('should be able to write and read file data if checksum matches', async () => {
    const indexDBBackend = new IndexedDBPPOMStorage('PPOMDB', 1);
    await indexDBBackend.write(
      { name: 'fake_name', chainId: '5' },
      enc.encode('fake_data'),
      '000000000000000000000000',
    );
    const file = await indexDBBackend.read(
      { name: 'fake_name', chainId: '5' },
      '000000000000000000000000',
    );
    expect(dec.decode(file)).toStrictEqual('fake_data');
  });

  it('should fail to write if checksum does not match', async () => {
    const indexDBBackend = new IndexedDBPPOMStorage('PPOMDB', 1);
    await expect(async () => {
      await indexDBBackend.write(
        { name: 'fake_name', chainId: '5' },
        enc.encode('fake_data'),
        'XXX',
      );
    }).rejects.toThrow('Checksum mismatch');
  });

  it('should fail to read if checksum does not match', async () => {
    const indexDBBackend = new IndexedDBPPOMStorage('PPOMDB', 1);
    await expect(async () => {
      await indexDBBackend.write(
        { name: 'fake_name', chainId: '5' },
        enc.encode('fake_data'),
        '000000000000000000000000',
      );
      await indexDBBackend.read({ name: 'fake_name', chainId: '5' }, 'XXX');
    }).rejects.toThrow('Checksum mismatch');
  });

  it('should delete a file when delete method is called', async () => {
    const indexDBBackend = new IndexedDBPPOMStorage('PPOMDB', 1);
    await indexDBBackend.write(
      { name: 'fake_name', chainId: '5' },
      enc.encode('fake_data'),
      '000000000000000000000000',
    );
    await indexDBBackend.delete({ name: 'fake_name', chainId: '5' });
    const result = await indexDBBackend.read(
      { name: 'fake_name', chainId: '5' },
      '000000000000000000000000',
    );
    expect(result).toBeUndefined();
  });

  it('should list all keys when dir is called', async () => {
    const keys = [
      { chainId: '5', name: 'fake_name_1' },
      { chainId: '1', name: 'fake_name_2' },
    ];
    const indexDBBackend = new IndexedDBPPOMStorage('PPOMDB', 1);
    await indexDBBackend.write(
      keys[0],
      enc.encode('fake_data_1'),
      '000000000000000000000000',
    );
    await indexDBBackend.write(
      keys[1],
      enc.encode('fake_data_2'),
      '000000000000000000000000',
    );
    const result = await indexDBBackend.dir();
    expect(result).toStrictEqual(keys);
  });
});
