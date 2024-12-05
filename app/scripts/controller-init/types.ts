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

export type ControllerInitRequest<MessengerType> = {
  getController<T>(name: ControllerName): T;

  getFlatState(): unknown;

  /** @deprecated */
  getGlobalChainId(): string;

  getMessenger(): MessengerType;

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
  MessengerType,
> {
  abstract init(request: ControllerInitRequest<MessengerType>): ControllerType;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract getMessengerCallback(): (controllerMessenger: any) => MessengerType;

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
