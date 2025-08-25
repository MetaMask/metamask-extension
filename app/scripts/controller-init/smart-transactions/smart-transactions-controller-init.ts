import SmartTransactionsController from '@metamask/smart-transactions-controller';
import { ClientId } from '@metamask/smart-transactions-controller/dist/types';
import type { Hex } from '@metamask/utils';
import { TransactionController } from '@metamask/transaction-controller';
import type { TraceCallback } from '@metamask/controller-utils';
import { getAllowedSmartTransactionsChainIds } from '../../../../shared/constants/smartTransactions';
import { getFeatureFlagsByChainId } from '../../../../shared/modules/selectors';
import { type ProviderConfigState } from '../../../../shared/modules/selectors/networks';
import { type FeatureFlagsMetaMaskState } from '../../../../shared/modules/selectors/feature-flags';
import type {
  MetaMetricsEventPayload,
  MetaMetricsEventOptions,
} from '../../../../shared/constants/metametrics';
import type { FeatureFlags } from '../../lib/smart-transaction/smart-transactions';
import { ControllerInitFunction, ControllerInitRequest } from '../types';
import { SmartTransactionsControllerMessenger } from '../messengers/smart-transactions-controller-messenger';
import { ControllerFlatState } from '../controller-list';

type SmartTransactionsControllerInitRequest =
  ControllerInitRequest<SmartTransactionsControllerMessenger> & {
    getStateUI: () => { metamask: ControllerFlatState };
    getGlobalNetworkClientId: () => string;
    getAccountType: (address: string) => Promise<string>;
    getDeviceModel: (address: string) => Promise<string>;
    getHardwareTypeForMetric: (address: string) => Promise<string>;
    trace: TraceCallback;
    trackEvent: (
      payload: MetaMetricsEventPayload,
      options?: MetaMetricsEventOptions,
    ) => void;
  };

export const SmartTransactionsControllerInit: ControllerInitFunction<
  SmartTransactionsController,
  SmartTransactionsControllerMessenger
> = (request) => {
  const {
    controllerMessenger,
    getController,
    persistedState,
    getStateUI,
    getGlobalNetworkClientId,
    getAccountType,
    getDeviceModel,
    getHardwareTypeForMetric,
    trace,
    trackEvent,
  } = request as SmartTransactionsControllerInitRequest;

  const transactionController = getController(
    'TransactionController',
  ) as TransactionController;

  const smartTransactionsController = new SmartTransactionsController({
    supportedChainIds: getAllowedSmartTransactionsChainIds() as Hex[],
    clientId: ClientId.Extension,
    getNonceLock: (address: string, networkClientId?: string) =>
      transactionController.getNonceLock(
        address,
        networkClientId || getGlobalNetworkClientId(),
      ),
    confirmExternalTransaction: (...args) =>
      transactionController.confirmExternalTransaction(...args),
    trackMetaMetricsEvent: trackEvent as ConstructorParameters<
      typeof SmartTransactionsController
    >[0]['trackMetaMetricsEvent'],
    state: persistedState.SmartTransactionsController,
    // Type mismatch due to different BaseController versions, need to update this in the STX controller first.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messenger: controllerMessenger as any,
    getTransactions: (...args) =>
      transactionController.getTransactions(...args),
    updateTransaction: (...args) =>
      transactionController.updateTransaction(...args),
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
