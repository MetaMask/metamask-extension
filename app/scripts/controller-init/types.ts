import { Provider } from '@metamask/network-controller';
import {
  ActionConstraint,
  ControllerMessenger,
  EventConstraint,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { TransactionMetricsRequest } from '../lib/transaction/metrics';

export type BaseControllerMessenger = ControllerMessenger<
  ActionConstraint,
  EventConstraint
>;

export type BaseRestrictedControllerMessenger = RestrictedControllerMessenger<
  string,
  ActionConstraint,
  EventConstraint,
  string,
  string
>;

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
  ControllerMessengerType extends BaseRestrictedControllerMessenger,
  InitMessengerType extends BaseRestrictedControllerMessenger,
> = {
  getController<T>(name: ControllerName): T;

  getControllerMessenger(): ControllerMessengerType;

  getFlatState(): unknown;

  /** @deprecated */
  getGlobalChainId(): string;

  getInitMessenger(): InitMessengerType;

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
  ControllerMessengerType extends BaseRestrictedControllerMessenger,
  InitMessengerType extends BaseRestrictedControllerMessenger,
> {
  abstract init(
    request: ControllerInitRequest<ControllerMessengerType, InitMessengerType>,
  ): ControllerType;

  abstract getControllerMessengerCallback(): (
    controllerMessenger: BaseControllerMessenger,
  ) => ControllerMessengerType;

  abstract getInitMessengerCallback(): (
    controllerMessenger: BaseControllerMessenger,
  ) => InitMessengerType;

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
