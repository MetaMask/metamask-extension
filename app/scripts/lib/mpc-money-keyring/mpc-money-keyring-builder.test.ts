import {
  MpcMoneyKeyring as MpcMoneyKeyringV2,
  type MpcMoneyKeyringOptions,
} from '@metamask/eth-money-mpc-keyring/v2';
import { EthAccountType, EthScope } from '@metamask/keyring-api';
import { MpcMoneyKeyring } from './mpc-money-keyring';
import {
  buildMpcMoneyKeyringBuilder,
  buildMpcMoneyKeyringV2Builder,
} from './mpc-money-keyring-builder';

const STATIC_ADDRESS = '0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd';

describe('buildMpcMoneyKeyringBuilder', () => {
  const originalAddress = process.env.MM_MONEY_MPC_ADDRESS;

  afterEach(() => {
    if (originalAddress === undefined) {
      delete process.env.MM_MONEY_MPC_ADDRESS;
    } else {
      process.env.MM_MONEY_MPC_ADDRESS = originalAddress;
    }
  });

  it('is keyed by the MPC money keyring type', () => {
    expect(buildMpcMoneyKeyringBuilder().type).toBe(MpcMoneyKeyring.type);
    expect(buildMpcMoneyKeyringBuilder().type).toBe('MPC Money Keyring');
  });

  it('builds the local V1 stub', () => {
    expect(buildMpcMoneyKeyringBuilder()()).toBeInstanceOf(MpcMoneyKeyring);
  });

  it('serves the static address configured through MM_MONEY_MPC_ADDRESS', async () => {
    process.env.MM_MONEY_MPC_ADDRESS = STATIC_ADDRESS;
    const keyring = buildMpcMoneyKeyringBuilder()();

    await expect(keyring.getAccounts()).resolves.toStrictEqual([
      STATIC_ADDRESS,
    ]);
  });
});

describe('buildMpcMoneyKeyringV2Builder', () => {
  const originalAddress = process.env.MM_MONEY_MPC_ADDRESS;

  afterEach(() => {
    if (originalAddress === undefined) {
      delete process.env.MM_MONEY_MPC_ADDRESS;
    } else {
      process.env.MM_MONEY_MPC_ADDRESS = originalAddress;
    }
  });

  it('is keyed by the legacy MPC money keyring type, which is how the controller dispatches it', () => {
    expect(buildMpcMoneyKeyringV2Builder().type).toBe(MpcMoneyKeyring.type);
  });

  it('wraps the legacy keyring passed to it', async () => {
    const legacyKeyring = buildMpcMoneyKeyringBuilder()();

    const wrapper = buildMpcMoneyKeyringV2Builder()(
      legacyKeyring as MpcMoneyKeyringOptions['legacyKeyring'],
      { id: 'ignored-metadata-id', name: '' },
    );

    expect(wrapper).toBeInstanceOf(MpcMoneyKeyringV2);
    // No static address is configured, so the keyring serves no accounts.
    await expect(wrapper.getAccounts()).resolves.toStrictEqual([]);
  });

  it('maps the static address served by the stub to an EOA account with MPC entropy', async () => {
    process.env.MM_MONEY_MPC_ADDRESS = STATIC_ADDRESS;
    const wrapper = new MpcMoneyKeyringV2({
      legacyKeyring: new MpcMoneyKeyring(),
    });

    const accounts = await wrapper.getAccounts();

    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({
      type: EthAccountType.Eoa,
      address: STATIC_ADDRESS,
      scopes: [EthScope.Eoa],
      options: {
        entropy: {
          type: 'mpc',
        },
      },
    });
    expect(typeof accounts[0].id).toBe('string');
  });

  it('createAccounts returns the existing account served by the stub, without running the MPC setup', async () => {
    process.env.MM_MONEY_MPC_ADDRESS = STATIC_ADDRESS;
    const legacyKeyring = new MpcMoneyKeyring();
    const setupSpy = jest.spyOn(legacyKeyring, 'setup');
    const wrapper = new MpcMoneyKeyringV2({ legacyKeyring });

    await expect(
      wrapper.createAccounts({ type: 'custom' }),
    ).resolves.toHaveLength(1);

    expect(setupSpy).not.toHaveBeenCalled();
  });

  it('deleting accounts is not supported', async () => {
    const wrapper = new MpcMoneyKeyringV2({
      legacyKeyring: new MpcMoneyKeyring(),
    });

    await expect(
      wrapper.deleteAccount('7f392e73-9dbb-4ac8-a912-25f0bfa944ae'),
    ).rejects.toThrow('MpcMoneyKeyring: deleting accounts is not supported');
  });
});
