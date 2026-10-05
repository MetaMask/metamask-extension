import { MpcKeyring as MpcKeyringV2 } from '@metamask/eth-mpc-keyring/v2';
import {
  buildMpcKeyringBuilder,
  buildMpcKeyringV2Builder,
} from './mpc-keyring-builder';
import { MpcKeyring } from './mpc-keyring';

describe('buildMpcKeyringBuilder', () => {
  it('is keyed by the MPC keyring type', () => {
    expect(buildMpcKeyringBuilder().type).toBe(MpcKeyring.type);
    expect(buildMpcKeyringBuilder().type).toBe('MPC Keyring');
  });

  it('builds an MpcKeyring', () => {
    expect(buildMpcKeyringBuilder()()).toBeInstanceOf(MpcKeyring);
  });
});

describe('buildMpcKeyringV2Builder', () => {
  it('is keyed by the legacy MPC keyring type, which is how the controller dispatches it', () => {
    expect(buildMpcKeyringV2Builder().type).toBe(MpcKeyring.type);
  });

  it('wraps the legacy keyring passed to it', async () => {
    const legacyKeyring = buildMpcKeyringBuilder()();

    const wrapper = buildMpcKeyringV2Builder()(legacyKeyring as never, {
      id: 'ignored-metadata-id',
      name: '',
    }) as unknown as MpcKeyringV2;

    expect(wrapper).toBeInstanceOf(MpcKeyringV2);
    // The stub keyring manages no accounts until the MPC setup runs.
    await expect(wrapper.getAccounts()).resolves.toStrictEqual([]);
  });
});
