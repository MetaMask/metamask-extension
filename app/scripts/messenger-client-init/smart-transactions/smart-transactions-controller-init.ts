import {
  SmartTransactionsController,
  SmartTransactionsControllerMessenger,
  ClientId,
} from '@metamask/smart-transactions-controller';
import type { Hex } from '@metamask/utils';
import type { TraceCallback } from '@metamask/controller-utils';
import { getAllowedSmartTransactionsChainIds } from '../../../../shared/constants/smartTransactions';
import type {
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
} from '../../../../shared/constants/metametrics';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';
import {
  MessengerClientInitFunction,
  MessengerClientInitRequest,
} from '../types';
import { SmartTransactionsControllerInitMessenger } from '../messengers/smart-transactions-controller-messenger';
// This import is only used for the type.
// eslint-disable-next-line import-x/no-restricted-paths
import type { MetaMaskReduxState } from '../../../../ui/store/store';

type SmartTransactionsControllerInitRequest = MessengerClientInitRequest<
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

export const SmartTransactionsControllerInit: MessengerClientInitFunction<
  SmartTransactionsController,
  SmartTransactionsControllerMessenger,
  SmartTransactionsControllerInitMessenger
> = (request) => {
  const {
    controllerMessenger,
    persistedState,
    getUIState,
    getAccountType,
    getDeviceModel,
    getHardwareTypeForMetric,
    trace,
  } = request as SmartTransactionsControllerInitRequest;

  const trackMetaMetricsEvent = (
    payload: MetaMetricsEventPayload,
    options?: MetaMetricsEventOptions,
  ) => {
    trackEvent(
      createEventBuilder(payload.event)
        .addProperties({
          ...(payload.properties ?? {}),
          ...(payload.category === undefined
            ? {}
            : { category: payload.category }),
          ...(payload.revenue === undefined
            ? {}
            : { revenue: payload.revenue }),
          ...(payload.value === undefined ? {} : { value: payload.value }),
          ...(payload.currency === undefined
            ? {}
            : { currency: payload.currency }),
        })
        .addSensitiveProperties(payload.sensitiveProperties)
        .build({
          environmentType: payload.environmentType,
          page: payload.page,
          referrer: payload.referrer,
          excludeMetaMetricsId: options?.excludeMetaMetricsId,
          matomoEvent: options?.matomoEvent,
        }),
    );
  };

  const smartTransactionsController = new SmartTransactionsController({
    supportedChainIds: getAllowedSmartTransactionsChainIds() as Hex[],
    clientId: ClientId.Extension,
    trackMetaMetricsEvent: trackMetaMetricsEvent as ConstructorParameters<
      typeof SmartTransactionsController
    >[0]['trackMetaMetricsEvent'],
    state: persistedState.SmartTransactionsController,
    messenger: controllerMessenger,
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
    messengerClient: smartTransactionsController,
  };
};
