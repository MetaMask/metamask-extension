/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ActionConstraint,
  BaseController,
  ControllerMessenger,
  EventConstraint,
} from '@metamask/base-controller';

type StateUI = { metamask: any } & Record<string, any>;

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

  getStateUI: () => StateUI;

  getTransactionMetricsRequest(): any;

  persistedState: Record<string, any>;
};

export type ControllerGetApiRequest<T extends BaseController<any, any, any>> = {
  controller: T;
  getFlatState: () => any;
};

export type ControllerApi = (...args: any[]) => any;

export type ControllerGetApiResponse = Record<string, ControllerApi>;

export abstract class ControllerInit<T extends BaseController<any, any, any>> {
  abstract init(request: ControllerInitRequest): T;

  getApi(_request: ControllerGetApiRequest<T>): ControllerGetApiResponse {
    return {};
  }
}
