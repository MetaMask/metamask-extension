import { InstitutionalSnapController } from '../../controllers/institutional-snap/InstitutionalSnapController';
import { InstitutionalSnapControllerMessenger } from '../messengers/accounts/institutional-snap-controller-messenger';
import { ControllerInitFunction } from '../types';

export const InstitutionalSnapControllerInit: ControllerInitFunction<
  InstitutionalSnapController,
  InstitutionalSnapControllerMessenger
> = (request) => {
  const controller = new InstitutionalSnapController({
    messenger: request.controllerMessenger,
  });

  return {
    controller,
  };
};
