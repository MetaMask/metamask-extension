import { PasskeyController } from '@metamask/passkey-controller';
import type { PasskeyControllerMessenger } from './messengers';
import type { ControllerInitFunction } from './types';

const PASSKEY_RP_ID = 'metamask.io';

export const PasskeyControllerInit: ControllerInitFunction<
  PasskeyController,
  PasskeyControllerMessenger
> = ({ controllerMessenger, persistedState, extension }) => {
  const extensionId = extension.runtime?.id ?? '';
  const expectedOrigin = extensionId ? `chrome-extension://${extensionId}` : '';

  const controller = new PasskeyController({
    state: persistedState.PasskeyController,
    messenger: controllerMessenger,
    rpID: PASSKEY_RP_ID,
    expectedOrigin,
  });

  return {
    controller,
  };
};
