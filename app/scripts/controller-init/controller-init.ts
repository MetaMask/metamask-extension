/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ActionConstraint,
  BaseController,
  ControllerMessenger,
  EventConstraint,
} from '@metamask/base-controller';

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

export abstract class ControllerInit<T extends BaseController<any, any, any>> {
  public abstract init(request: ControllerInitRequest): T;
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

  getStateUI: () => { metamask: any } & Record<string, any>;

  getTransactionMetricsRequest(): any;

  persistedState: Record<string, any>;
};
