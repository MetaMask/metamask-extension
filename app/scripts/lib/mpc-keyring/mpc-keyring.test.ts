import type { TypedTransaction } from '@ethereumjs/tx';
import type { EIP7702Authorization } from '@metamask/eth-sig-util';
import type { Hex, Json } from '@metamask/utils';

import { MpcKeyring } from './mpc-keyring';

const MOCK_ADDRESS = '0x1111111111111111111111111111111111111111' as Hex;

describe('MpcKeyring (stub)', () => {
  it('exposes the expected type constant', () => {
    const keyring = new MpcKeyring();
    expect(MpcKeyring.type).toBe('MPC Keyring');
    expect(keyring.type).toBe('MPC Keyring');
  });

  it('constructs without touching the MPC stack', () => {
    expect(() => new MpcKeyring()).not.toThrow();
  });

  it('returns an empty account list', async () => {
    const keyring = new MpcKeyring();
    expect(await keyring.getAccounts()).toStrictEqual([]);
  });

  it('serializes to an empty object', async () => {
    const keyring = new MpcKeyring();
    expect(await keyring.serialize()).toStrictEqual({});
  });

  it('deserializes without keeping state', async () => {
    const keyring = new MpcKeyring();
    expect(
      await keyring.deserialize({ keyShare: 'mock' } as Json),
    ).toBeUndefined();
    expect(await keyring.getAccounts()).toStrictEqual([]);
  });

  it('throws not implemented for init', async () => {
    const keyring = new MpcKeyring();
    await expect(keyring.init('create')).rejects.toThrow('Not implemented');
    await expect(keyring.init()).rejects.toThrow('Not implemented');
  });

  it('throws not implemented for addAccounts', async () => {
    const keyring = new MpcKeyring();
    await expect(keyring.addAccounts()).rejects.toThrow('Not implemented');
    await expect(keyring.addAccounts(2)).rejects.toThrow('Not implemented');
  });

  it('throws not implemented for getAppKeyAddress', async () => {
    const keyring = new MpcKeyring();
    await expect(
      keyring.getAppKeyAddress(MOCK_ADDRESS, 'https://example.com'),
    ).rejects.toThrow('Not implemented');
  });

  it('throws not implemented for the signing methods', async () => {
    const keyring = new MpcKeyring();

    await expect(
      keyring.signTransaction(MOCK_ADDRESS, {} as TypedTransaction),
    ).rejects.toThrow('Not implemented');

    await expect(
      keyring.signPersonalMessage(MOCK_ADDRESS, '0x68656c6c6f'),
    ).rejects.toThrow('Not implemented');

    await expect(
      keyring.signTypedData(MOCK_ADDRESS, [
        { type: 'string', name: 'Message', value: 'Hi!' },
      ]),
    ).rejects.toThrow('Not implemented');

    await expect(
      keyring.signEip7702Authorization(MOCK_ADDRESS, [
        1,
        MOCK_ADDRESS,
        0,
      ] as unknown as EIP7702Authorization),
    ).rejects.toThrow('Not implemented');
  });

  it('throws not implemented for the maintenance operations', async () => {
    const keyring = new MpcKeyring();

    await expect(keyring.rotateKeyShares()).rejects.toThrow('Not implemented');
    await expect(keyring.checkKeyShare()).rejects.toThrow('Not implemented');
    await expect(keyring.syncKeyShare()).rejects.toThrow('Not implemented');
  });
});
