import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

export type PasskeyControllerMessenger = ReturnType<
  typeof getPasskeyControllerMessenger
>;

export function getPasskeyControllerMessenger(messenger: RootMessenger) {
  return new Messenger({
    namespace: 'PasskeyController',
    parent: messenger,
  });
}
