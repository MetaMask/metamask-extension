import { type Hex } from '@metamask/utils';
import { MPC_KEYRING_TYPE } from '../../../../shared/constants/mpc-keyring';
import {
  MoneyAccountMpcService,
  type MoneyAccountMpcMessenger,
} from './money-account-mpc-service';

const MPC_ADDRESS = '0x2222222222222222222222222222222222222222' as Hex;

function createService(
  call: MoneyAccountMpcMessenger['call'],
): MoneyAccountMpcService {
  const messenger = {
    call,
    registerMethodActionHandlers: jest.fn(),
  } as unknown as MoneyAccountMpcMessenger;

  return new MoneyAccountMpcService({ messenger });
}

describe('MoneyAccountMpcService', () => {
  it('creates an MPC keyring and migrates the money account onto it', async () => {
    const call = jest.fn(async (action: string) => {
      if (action === 'MoneyAccountController:init') {
        return undefined;
      }
      if (action === 'KeyringController:getState') {
        return { keyrings: [] };
      }
      if (action === 'KeyringController:addNewKeyring') {
        return { id: 'mpc-keyring-id' };
      }
      if (action === 'KeyringController:withKeyring') {
        return [MPC_ADDRESS];
      }
      if (action === 'MoneyAccountController:migrateMoneyAccountAddress') {
        return undefined;
      }
      throw new Error(`Unexpected action: ${action}`);
    });
    const service = createService(call as MoneyAccountMpcMessenger['call']);

    await expect(service.enableMfa()).resolves.toStrictEqual({
      address: MPC_ADDRESS,
    });

    expect(call).toHaveBeenCalledWith(
      'KeyringController:addNewKeyring',
      MPC_KEYRING_TYPE,
      { mode: 'create' },
    );
    expect(call).toHaveBeenCalledWith(
      'MoneyAccountController:migrateMoneyAccountAddress',
      MPC_ADDRESS,
    );
  });

  it('reuses an existing MPC account instead of creating another keyring', async () => {
    const call = jest.fn(async (action: string) => {
      if (action === 'MoneyAccountController:init') {
        return undefined;
      }
      if (action === 'KeyringController:getState') {
        return {
          keyrings: [
            {
              type: MPC_KEYRING_TYPE,
              accounts: [MPC_ADDRESS],
              metadata: { id: 'mpc-keyring-id', name: '' },
            },
          ],
        };
      }
      if (action === 'MoneyAccountController:migrateMoneyAccountAddress') {
        return undefined;
      }
      throw new Error(`Unexpected action: ${action}`);
    });
    const service = createService(call as MoneyAccountMpcMessenger['call']);

    await expect(service.enableMfa()).resolves.toStrictEqual({
      address: MPC_ADDRESS,
    });

    expect(call).not.toHaveBeenCalledWith(
      'KeyringController:addNewKeyring',
      expect.anything(),
      expect.anything(),
    );
  });
});
