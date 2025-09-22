import {
  SmartTransactionsController,
  ClientId,
} from '@metamask/smart-transactions-controller';
import type { Hex } from '@metamask/utils';
import type { TraceCallback } from '@metamask/controller-utils';
import { getAllowedSmartTransactionsChainIds } from '../../../../shared/constants/smartTransactions';
import { getFeatureFlagsByChainId } from '../../../../shared/modules/selectors';
import { type ProviderConfigState } from '../../../../shared/modules/selectors/networks';
import { type FeatureFlagsMetaMaskState } from '../../../../shared/modules/selectors/feature-flags';
import type { FeatureFlags } from '../../lib/smart-transaction/smart-transactions';
import { ControllerInitFunction, ControllerInitRequest } from '../types';
import {
  SmartTransactionsControllerInitMessenger,
  SmartTransactionsControllerMessenger,
} from '../messengers/smart-transactions-controller-messenger';
import { ControllerFlatState } from '../controller-list';

type SmartTransactionsControllerInitRequest = ControllerInitRequest<
  SmartTransactionsControllerMessenger,
  SmartTransactionsControllerInitMessenger
> & {
  getStateUI: () => { metamask: ControllerFlatState };
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
    getStateUI,
    getAccountType,
    getDeviceModel,
    getHardwareTypeForMetric,
    trace,
  } = request as SmartTransactionsControllerInitRequest;

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
    getFeatureFlags: () => {
      const state = getStateUI();
      return getFeatureFlagsByChainId(
        state as unknown as ProviderConfigState & FeatureFlagsMetaMaskState,
      ) as unknown as FeatureFlags;
    },
    getMetaMetricsProps: async () => {
      const { metamask } = getStateUI();
      const { internalAccounts } = metamask as Pick<
        ControllerFlatState,
        'internalAccounts'
      >;
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
