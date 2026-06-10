import { MessengerClientInitFunction } from '../types';
import { SnapKeyringV2BuilderMessenger } from '../messengers/accounts';
import {
  snapKeyringV2Builder,
  SnapKeyringV2Builder,
} from '../../lib/snap-keyring/snap-keyring-v2';

/**
 * Initialize the v2 Snap keyring builder.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the keyring
 * builder.
 * @returns The initialized controller.
 */
export const SnapKeyringV2BuilderInit: MessengerClientInitFunction<
  SnapKeyringV2Builder,
  SnapKeyringV2BuilderMessenger
> = () => {
  const builder = snapKeyringV2Builder();

  return {
    persistedStateKey: null,
    memStateKey: null,
    messengerClient: builder,
  };
};
