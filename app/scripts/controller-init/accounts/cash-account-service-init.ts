import { CashAccountService } from '@metamask-previews/cash-account-service';
import { ControllerInitFunction } from '../types';
import { CashAccountServiceMessenger } from '../messengers/accounts';

/**
 * Initialize the cash account service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @returns The initialized service.
 */
export const CashAccountServiceInit: ControllerInitFunction<
  CashAccountService,
  CashAccountServiceMessenger
> = ({ controllerMessenger }) => {
  console.log('[CashAccountService] Starting initialization');

  console.log('[CashAccountService] Creating CashAccountService instance');
  const controller = new CashAccountService({
    messenger: controllerMessenger,
  });
  console.log('[CashAccountService] Instance created successfully');

  console.log('[CashAccountService] Initialization complete');
  return {
    memStateKey: null,
    persistedStateKey: null,
    controller,
  };
};
