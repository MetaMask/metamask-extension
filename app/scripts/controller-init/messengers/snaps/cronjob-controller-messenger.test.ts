import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getCronjobControllerMessenger } from './cronjob-controller-messenger';

describe('getCronjobControllerMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const cronjobControllerMessenger =
      getCronjobControllerMessenger(controllerMessenger);

    expect(cronjobControllerMessenger).toBeInstanceOf(Messenger);
  });
});
