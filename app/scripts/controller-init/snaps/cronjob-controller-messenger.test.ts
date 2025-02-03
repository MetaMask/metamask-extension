import {
  ControllerMessenger,
  RestrictedMessenger,
} from '@metamask/base-controller';
import { getCronjobControllerMessenger } from './cronjob-controller-messenger';

describe('getCronjobControllerMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new ControllerMessenger<never, never>();
    const cronjobControllerMessenger =
      getCronjobControllerMessenger(controllerMessenger);

    expect(cronjobControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
