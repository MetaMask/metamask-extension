import { RestrictedMessenger } from '@metamask/base-controller';
import { KeyringControllerGetKeyringForAccountAction } from '@metamask/keyring-controller';
import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import { GetSnap } from '@metamask/snaps-controllers';
import { Snap } from '@metamask/snaps-utils';
import { HardwareKeyringType } from '../../../../shared/constants/hardware-wallets';

type AllowedActions =
  | GetSnap
  | KeyringControllerGetKeyringForAccountAction
  | AccountsControllerGetSelectedAccountAction;

export type SnapAndHardwareMessenger = RestrictedMessenger<
  'SnapAndHardwareMessenger',
  AllowedActions,
  never,
  AllowedActions['type'],
  never
>;

export async function getSnapAndHardwareInfoForMetrics(
  getAccountType: (address: string) => Promise<string>,
  getDeviceModel: (address: string) => Promise<string>,
  getHardwareTypeForMetric: (address: string) => Promise<HardwareKeyringType>,
  messenger: SnapAndHardwareMessenger,
) {
  // If it's coming from a unit test, there's no messenger
  // Will fix this in a future PR and add proper unit tests
  if (!messenger) {
    return {};
  }

  const account = messenger.call('AccountsController:getSelectedAccount');
  const selectedAddress = account.address;

  let snap;
  if (account.metadata.snap?.id) {
    snap = messenger.call(
      'SnapController:get',
      account.metadata.snap?.id,
    ) as Snap;
  }

  return {
    account_type: await getAccountType(selectedAddress),
    device_model: await getDeviceModel(selectedAddress),
    account_hardware_type: await getHardwareTypeForMetric(selectedAddress),
    account_snap_type: snap?.id,
    account_snap_version: snap?.version,
  };
}
