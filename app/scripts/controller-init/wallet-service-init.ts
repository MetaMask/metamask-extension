//========
// Boilerplate for initializing the WalletServiceMessenger.
//========

import {
  WalletService,
  WalletServiceMessenger,
} from '../services/wallet-service';
import { ControllerInitFunction } from './types';

/**
 * Initialize the error reporting service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized controller.
 */
export const WalletServiceInit: ControllerInitFunction<
  WalletService,
  WalletServiceMessenger
> = ({ controllerMessenger }) => {
  const service = new WalletService({
    messenger: controllerMessenger,
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller: service,
  };
};
