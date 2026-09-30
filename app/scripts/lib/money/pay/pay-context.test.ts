import type { Hex } from '@metamask/utils';
import { getMoneyPayContext } from './pay-context';
import {
  createMoneyPayMessengerMock,
  MONEY_ACCOUNT_ADDRESS_MOCK,
  NETWORK_CLIENT_ID_MOCK,
  VAULT_CONFIG_MOCK,
} from './test-mocks';

describe('getMoneyPayContext', () => {
  it('resolves the context when the money account address is valid hex', () => {
    const { messenger } = createMoneyPayMessengerMock();

    const context = getMoneyPayContext(messenger);

    expect(context).toStrictEqual({
      moneyAccountAddress: MONEY_ACCOUNT_ADDRESS_MOCK,
      vaultConfig: VAULT_CONFIG_MOCK,
      networkClientId: NETWORK_CLIENT_ID_MOCK,
      provider: expect.anything(),
    });
  });

  it('returns undefined when the money account is not created yet', () => {
    const { messenger } = createMoneyPayMessengerMock({
      moneyAccountAddress: undefined,
    });

    expect(getMoneyPayContext(messenger)).toBeUndefined();
  });

  it('returns undefined when the money account address is not valid hex', () => {
    const { messenger } = createMoneyPayMessengerMock({
      handlers: {
        'MoneyAccountController:getMoneyAccount': () => ({
          address: 'not-a-hex-address',
        }),
      },
    });

    expect(getMoneyPayContext(messenger)).toBeUndefined();
  });

  it('returns undefined when the money account address is empty', () => {
    const { messenger } = createMoneyPayMessengerMock({
      handlers: {
        'MoneyAccountController:getMoneyAccount': () => ({ address: '' }),
      },
    });

    expect(getMoneyPayContext(messenger)).toBeUndefined();
  });

  it('returns undefined when the vault config is unavailable', () => {
    const { messenger } = createMoneyPayMessengerMock({
      remoteFeatureFlags: {},
    });

    expect(getMoneyPayContext(messenger)).toBeUndefined();
  });

  it('returns undefined when the money chain is not configured', () => {
    const { messenger } = createMoneyPayMessengerMock({
      chainNotConfigured: true,
    });

    expect(getMoneyPayContext(messenger)).toBeUndefined();
  });

  it('resolves the network client for an explicit chain override', () => {
    const { messenger, call } = createMoneyPayMessengerMock();
    const overrideChainId = '0x1' as Hex;

    getMoneyPayContext(messenger, overrideChainId);

    expect(call).toHaveBeenCalledWith(
      'NetworkController:findNetworkClientIdByChainId',
      overrideChainId,
    );
  });
});
