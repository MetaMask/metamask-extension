import { OcapKernelController } from '../controllers/ocap-kernel-controller';
import { MessengerClientInitFunction } from './types';
import { OcapKernelControllerMessenger } from './messengers';

export const OcapKernelControllerInit: MessengerClientInitFunction<
  OcapKernelController,
  OcapKernelControllerMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new OcapKernelController({
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
    persistedStateKey: null,
  };
};
