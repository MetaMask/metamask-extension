import type { DeviceInteraction } from '../../../speculos/device-interaction';
import type { ApduBridge } from '../../../speculos/apdu-bridge';
import { SPECULOS_LEDGER_ADDRESS } from '../../../speculos/constants';

export { SPECULOS_LEDGER_ADDRESS } from '../../../speculos/constants';

export const LEDGER_SEED_BALANCE = [
  { address: SPECULOS_LEDGER_ADDRESS, balance: '0x100000000000000000000' },
];

export const RECIPIENT = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

export function approveBlindSigning(
  interaction: DeviceInteraction,
  apduBridge: ApduBridge,
  scrollCount?: number,
) {
  return apduBridge.waitForSigningApduAndApproveBlindSigning(
    interaction,
    90000,
    scrollCount,
  );
}

export function approveSigning(
  interaction: DeviceInteraction,
  apduBridge: ApduBridge,
) {
  return apduBridge.waitForSigningApduAndApproveSigning(interaction, 90000);
}

export function approveTransaction(
  interaction: DeviceInteraction,
  apduBridge: ApduBridge,
) {
  return apduBridge.waitForSigningApduAndApprove(interaction, 90000);
}

export async function rejectTransaction(
  interaction: DeviceInteraction,
  apduBridge: ApduBridge,
) {
  await apduBridge.waitForSigningApdu(90000);
  await new Promise((r) => setTimeout(r, 1000));
  await interaction.rejectTransaction();
}
