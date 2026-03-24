import { Messenger } from '@metamask/messenger';
import type { OcapKernelControllerActions } from '../../controllers/ocap-kernel-controller';
import { RootMessenger } from '../../lib/messenger';

export type OcapKernelControllerMessenger = ReturnType<
  typeof getOcapKernelControllerMessenger
>;

/**
 * Create a messenger for the OcapKernelController.
 *
 * @param messenger - The root messenger.
 */
export function getOcapKernelControllerMessenger(
  messenger: RootMessenger<OcapKernelControllerActions, never>,
) {
  return new Messenger<'OcapKernelController', never, never, typeof messenger>({
    namespace: 'OcapKernelController',
    parent: messenger,
  });
}
