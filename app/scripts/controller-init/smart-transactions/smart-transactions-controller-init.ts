import {
  SmartTransactionsController,
  SmartTransactionsControllerMessenger,
  ClientId,
} from '@metamask/smart-transactions-controller';
import type { Hex } from '@metamask/utils';
import type { TraceCallback } from '@metamask/controller-utils';
import log from 'loglevel';
import { getAllowedSmartTransactionsChainIds } from '../../../../shared/constants/smartTransactions';
import { ControllerInitFunction, ControllerInitRequest } from '../types';
import { SmartTransactionsControllerInitMessenger } from '../messengers/smart-transactions-controller-messenger';
// This import is only used for the type.
// eslint-disable-next-line import-x/no-restricted-paths
import type { MetaMaskReduxState } from '../../../../ui/store/store';

type SmartTransactionsControllerInitRequest = ControllerInitRequest<
  SmartTransactionsControllerMessenger,
  SmartTransactionsControllerInitMessenger
> & {
  getUIState: () => MetaMaskReduxState['metamask'];
  getGlobalNetworkClientId: () => string;
  getAccountType: (address: string) => Promise<string>;
  getDeviceModel: (address: string) => Promise<string>;
  getHardwareTypeForMetric: (address: string) => Promise<string>;
  trace: TraceCallback;
};

export const SmartTransactionsControllerInit: ControllerInitFunction<
  SmartTransactionsController,
  SmartTransactionsControllerMessenger,
  SmartTransactionsControllerInitMessenger
> = (request) => {
  const {
    controllerMessenger,
    initMessenger,
    persistedState,
    getUIState,
    getAccountType,
    getDeviceModel,
    getHardwareTypeForMetric,
    trace,
  } = request as SmartTransactionsControllerInitRequest;

  /**
   * Bearer token is only present when the user is signed in (AuthenticationController
   * has a valid session). If getBearerToken returns undefined, no Authorization header is sent.
   * To test with a real token: enable "Use external services" and "Backup and Sync" in Settings;
   * see docs/testing-stx-authentication.md.
   * To see [STX auth] logs: chrome://extensions → MetaMask → "Inspect views: Service worker", then reload the extension.
   */
  const getBearerToken = async (): Promise<string | undefined> => {
    try {
      const token = await Promise.resolve(
        initMessenger.call('AuthenticationController:getBearerToken'),
      );
      if (token) {
        return token;
      }
      return undefined;
    } catch (err) {
      log.warn('Failed to get bearer token', err);
      return undefined;
    }
  };

  const smartTransactionsController = new SmartTransactionsController({
    supportedChainIds: getAllowedSmartTransactionsChainIds() as Hex[],
    clientId: ClientId.Extension,
    trackMetaMetricsEvent: initMessenger.call.bind(
      initMessenger,
      'MetaMetricsController:trackEvent',
    ) as ConstructorParameters<
      typeof SmartTransactionsController
    >[0]['trackMetaMetricsEvent'],
    state: persistedState.SmartTransactionsController,
    messenger: controllerMessenger,
    getBearerToken,
    getMetaMetricsProps: async () => {
      const metamask = getUIState();
      const { internalAccounts } = metamask;
      const selectedAccountId = internalAccounts?.selectedAccount;
      const selectedAccount = selectedAccountId
        ? internalAccounts?.accounts?.[selectedAccountId]
        : null;
      const selectedAddress = selectedAccount?.address ?? '';

      if (!selectedAddress) {
        return {
          accountHardwareType: undefined,
          accountType: undefined,
          deviceModel: undefined,
        };
      }

      const accountHardwareType =
        await getHardwareTypeForMetric(selectedAddress);
      const accountType = await getAccountType(selectedAddress);
      const deviceModel = await getDeviceModel(selectedAddress);
      return {
        accountHardwareType,
        accountType,
        deviceModel,
      };
    },
    trace,
  });

  return {
    controller: smartTransactionsController,
  };
};
