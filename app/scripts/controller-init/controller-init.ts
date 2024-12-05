import {
  ActionConstraint,
  ControllerMessenger,
  EventConstraint,
} from '@metamask/base-controller';
import { TransactionMetricsRequest } from '../lib/transaction/metrics';

export enum ControllerName {
  GasFeeController = 'GasFeeController',
  KeyringController = 'KeyringController',
  NetworkController = 'NetworkController',
  OnboardingController = 'OnboardingController',
  PermissionController = 'PermissionController',
  PreferencesController = 'PreferencesController',
  SmartTransactionsController = 'SmartTransactionsController',
  TransactionController = 'TransactionController',
  TransactionUpdateController = 'TransactionUpdateController',
}

export type ControllerInitRequest = {
  controllerMessenger: ControllerMessenger<ActionConstraint, EventConstraint>;

  getController<T>(name: ControllerName): T;

  /** @deprecated */
  getGlobalChainId(): string;

  getPermittedAccounts(
    origin: string,
    options?: { suppressUnauthorizedError?: boolean },
  ): Promise<string[]>;

  getStateUI: () => unknown & { metamask: unknown };

  getTransactionMetricsRequest(): TransactionMetricsRequest;

  persistedState: Record<string, unknown>;
};

export type ControllerGetApiRequest<T> = {
  controller: T;
  getFlatState: () => unknown;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ControllerApi = (...args: any[]) => unknown;

export type ControllerGetApiResponse = Record<string, ControllerApi>;

export abstract class ControllerInit<T extends { name: string }> {
  abstract init(request: ControllerInitRequest): T;

  getApi(_request: ControllerGetApiRequest<T>): ControllerGetApiResponse {
    return {};
  }

  getPersistedStateKey(controller: T): string | undefined {
    return controller.name;
  }

  getMemStateKey(controller: T): string | undefined {
    return controller.name;
  }
}
