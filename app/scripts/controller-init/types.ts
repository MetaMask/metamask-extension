import {
  ActionConstraint,
  ControllerMessenger,
  EventConstraint,
} from '@metamask/base-controller';
import { Provider } from '@metamask/network-controller';
import { TransactionMetricsRequest } from '../lib/transaction/metrics';

export enum ControllerName {
  GasFeeController = 'GasFeeController',
  KeyringController = 'KeyringController',
  NetworkController = 'NetworkController',
  OnboardingController = 'OnboardingController',
  PermissionController = 'PermissionController',
  PPOMController = 'PPOMController',
  PreferencesController = 'PreferencesController',
  SmartTransactionsController = 'SmartTransactionsController',
  TransactionController = 'TransactionController',
  TransactionUpdateController = 'TransactionUpdateController',
}

export type ControllerInitRequest<
  MessengerActions extends ActionConstraint,
  MessengerEvents extends EventConstraint,
> = {
  controllerMessenger: ControllerMessenger<MessengerActions, MessengerEvents>;

  getController<T>(name: ControllerName): T;

  /** @deprecated */
  getGlobalChainId(): string;

  getPermittedAccounts(
    origin: string,
    options?: { suppressUnauthorizedError?: boolean },
  ): Promise<string[]>;

  /** @deprecated */
  getProvider: () => Provider;

  getStateUI: () => unknown & { metamask: unknown };

  getTransactionMetricsRequest(): TransactionMetricsRequest;

  persistedState: Record<string, unknown>;
};

export type ControllerGetApiRequest<ControllerType> = {
  controller: ControllerType;
  getFlatState: () => unknown;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ControllerApi = (...args: any[]) => unknown;

export type ControllerGetApiResponse = Record<string, ControllerApi>;

export abstract class ControllerInit<
  ControllerType extends { name: string },
  MessengerActions extends ActionConstraint,
  MessengerEvents extends EventConstraint,
> {
  abstract init(
    request: ControllerInitRequest<MessengerActions, MessengerEvents>,
  ): ControllerType;

  getApi(
    _request: ControllerGetApiRequest<ControllerType>,
  ): ControllerGetApiResponse {
    return {};
  }

  getPersistedStateKey(controller: ControllerType): string | undefined {
    return controller.name;
  }

  getMemStateKey(controller: ControllerType): string | undefined {
    return controller.name;
  }
}
