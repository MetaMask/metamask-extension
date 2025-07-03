import SmartTransactionsController from '@metamask/smart-transactions-controller';
import { ClientId } from '@metamask/smart-transactions-controller/dist/types';
import type { Hex } from '@metamask/utils';
import { getAllowedSmartTransactionsChainIds } from '../../../../shared/constants/smartTransactions';
import { getFeatureFlagsByChainId } from '../../../../shared/modules/selectors';

export const SmartTransactionsControllerInit = ({
  baseControllerMessenger,
  getController,
  persistedState,
  getStateUI,
  getGlobalNetworkClientId,
  getAccountType,
  getDeviceModel,
  getHardwareTypeForMetric,
}: any) => {
  const accountsController = getController('AccountsController');
  const transactionController = getController('TransactionController');
  const metaMetricsController = getController('MetaMetricsController');

  const smartTransactionsControllerMessenger =
    baseControllerMessenger.getRestricted({
      name: 'SmartTransactionsController',
      allowedActions: [
        'NetworkController:getNetworkClientById',
        'NetworkController:getState',
      ],
      allowedEvents: ['NetworkController:stateChange'],
    });

  const smartTransactionsController = new SmartTransactionsController({
    supportedChainIds: getAllowedSmartTransactionsChainIds() as Hex[],
    clientId: ClientId.Extension,
    getNonceLock: (address: string) =>
      transactionController.getNonceLock(address, getGlobalNetworkClientId()),
    confirmExternalTransaction: (...args: any[]) =>
      transactionController.confirmExternalTransaction(...args),
    trackMetaMetricsEvent: metaMetricsController.trackEvent.bind(
      metaMetricsController,
    ),
    state: persistedState.SmartTransactionsController,
    messenger: smartTransactionsControllerMessenger,
    getTransactions: (...args: any[]) =>
      transactionController.getTransactions(...args),
    updateTransaction: (...args: any[]) =>
      transactionController.updateTransaction(...args),
    getFeatureFlags: () => {
      const state = getStateUI();
      const flags = getFeatureFlagsByChainId(state);
      // Return a default value if flags is null
      return (
        flags || {
          smartTransactions: {
            mobileActive: false,
            extensionActive: false,
            extensionReturnTxHashAsap: false,
          },
        }
      );
    },
    getMetaMetricsProps: async () => {
      const selectedAddress = accountsController.getSelectedAccount().address;
      const accountHardwareType = await getHardwareTypeForMetric(
        selectedAddress,
      );
      const accountType = await getAccountType(selectedAddress);
      const deviceModel = await getDeviceModel(selectedAddress);
      return {
        accountHardwareType,
        accountType,
        deviceModel,
      };
    },
  });

  return {
    controller: smartTransactionsController,
  };
};
