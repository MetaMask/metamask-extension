import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

export type RatesControllerMessenger = ReturnType<
  typeof getRatesControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * rates controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getRatesControllerMessenger(
  messenger: RootMessenger<never, never>,
) {
  return new Messenger<'RatesController', never, never, typeof messenger>({
    namespace: 'RatesController',
    parent: messenger,
  });
}
