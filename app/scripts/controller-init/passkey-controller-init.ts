import { PasskeyController } from '@metamask/passkey-controller';
import type { PasskeyControllerMessenger } from './messengers';
import type { ControllerInitFunction } from './types';

const PASSKEY_RP_ID = 'metamask.io';
const PASSKEY_RP_NAME = 'MetaMask';

export const PasskeyControllerInit: ControllerInitFunction<
  PasskeyController,
  PasskeyControllerMessenger
> = ({ controllerMessenger, persistedState, extension }) => {
  const extensionUrl = extension.runtime?.getURL?.('');
  const expectedOrigin = extensionUrl ? extensionUrl.replace(/\/$/u, '') : '';

  const controller = new PasskeyController({
    state: persistedState.PasskeyController,
    messenger: controllerMessenger,
    rpID: PASSKEY_RP_ID,
    rpName: PASSKEY_RP_NAME,
    expectedOrigin,
  });

  return {
    controller,
  };
};
