import { OcapKernelController } from '../controllers/ocap-kernel-controller';
import { ControllerInitFunction } from './types';
import { OcapKernelControllerMessenger } from './messengers';

export const OcapKernelControllerInit: ControllerInitFunction<
  OcapKernelController,
  OcapKernelControllerMessenger
> = ({ controllerMessenger }) => {
  const controller = new OcapKernelController({
    messenger: controllerMessenger,
  });

  return {
    controller,
    persistedStateKey: null,
  };
};
