import {
  ProofOfOwnershipService,
  ProofOfOwnershipServiceMessenger,
} from '@metamask/profile-metrics-controller';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the proof of ownership service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized service.
 */
export const ProofOfOwnershipServiceInit: MessengerClientInitFunction<
  ProofOfOwnershipService,
  ProofOfOwnershipServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new ProofOfOwnershipService({
    messenger: controllerMessenger,
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    messengerClient,
  };
};
