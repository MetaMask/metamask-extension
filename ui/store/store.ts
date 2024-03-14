import { StoreEnhancer } from 'redux';
import { configureStore as baseConfigureStore } from '@reduxjs/toolkit';
import devtoolsEnhancer from 'remote-redux-devtools';
import { ApprovalControllerState } from '@metamask/approval-controller';
import { GasEstimateType, GasFeeEstimates } from '@metamask/gas-fee-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { InternalAccount } from '@metamask/keyring-api';
import rootReducer from '../ducks';
import { LedgerTransportTypes } from '../../shared/constants/hardware-wallets';
import type { NetworkStatus } from '../../shared/constants/network';

/**
 * This interface is temporary and is copied from the message-manager.js file
 * and is the 'msgParams' key of the interface declared there. We should get a
 * universal Message type to use for this, the Message manager and all
 * the other types of messages.
 *
 * TODO: Replace this
 */
export type TemporaryMessageDataType = {
  id: string;
  type: string;
  msgParams: {
    metamaskId: string;
    data: string;
  };
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  metadata?: {
    custodyId?: string;
  };
  status?: string;
  ///: END:ONLY_INCLUDE_IF
};

export type MessagesIndexedById = {
  [id: string]: TemporaryMessageDataType;
};

/**
 * This interface is a temporary interface to describe the state tree that is
 * sent from the background. Ideally we can build this using Types in the
 * backend when we compose the stores, then we can import it here and use it.
 *
 * Some of this is duplicated in the metamask redux duck. In *most* cases the
 * state received from the background takes precedence over anything in the
 * metamask reducer.
 */
type TemporaryBackgroundState = {
  addressBook: {
    [chainId: string]: {
      name: string;
    }[];
  };
  providerConfig: {
    chainId: string;
  };
  transactions: TransactionMeta[];
  selectedAddress: string;
  identities: {
    [address: string]: {
      balance: string;
    };
  };
  ledgerTransportType: LedgerTransportTypes;
  unapprovedDecryptMsgs: MessagesIndexedById;
  unapprovedMsgs: MessagesIndexedById;
  unapprovedPersonalMsgs: MessagesIndexedById;
  unapprovedTypedMessages: MessagesIndexedById;
  networksMetadata: {
    [NetworkClientId: string]: {
      EIPS: { [eip: string]: boolean };
      status: NetworkStatus;
    };
  };
  selectedNetworkClientId: string;
  pendingApprovals: ApprovalControllerState['pendingApprovals'];
  approvalFlows: ApprovalControllerState['approvalFlows'];
  knownMethodData?: {
    [fourBytePrefix: string]: Record<string, unknown>;
  };
  gasFeeEstimates: GasFeeEstimates;
  gasEstimateType: GasEstimateType;
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  custodyAccountDetails?: { [key: string]: any };
  ///: END:ONLY_INCLUDE_IF
  internalAccounts: {
    accounts: {
      [key: string]: InternalAccount;
    };
    selectedAccount: string;
  };
};

type RootReducerReturnType = ReturnType<typeof rootReducer>;

export type CombinedBackgroundAndReduxState = RootReducerReturnType & {
  activeTab: {
    origin: string;
  };
  metamask: RootReducerReturnType['metamask'] & TemporaryBackgroundState;
};

export default function configureStore(preloadedState: any) {
  const debugModeEnabled = Boolean(process.env.METAMASK_DEBUG);
  const isDev = debugModeEnabled && !process.env.IN_TEST;
  const enhancers: StoreEnhancer[] = [];

  if (isDev) {
    enhancers.push(
      devtoolsEnhancer({
        name: 'MetaMask',
        hostname: 'localhost',
        port: 8000,
        realtime: true,
      }) as StoreEnhancer,
    );
  }

  return baseConfigureStore({
    reducer: rootReducer as () => CombinedBackgroundAndReduxState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        /**
         * We do not persist the redux tree for rehydration, so checking for
         * serializable state keys is not relevant for now. Any state that persists
         * is managed in the background. We may at some point want this, but we can
         * gradually implement by using the ignore options to ignore those actions
         * and state keys that are not serializable, preventing us from adding new
         * actions and state that would violate our ability to persist state keys.
         * NOTE: redux-thunk is included by default in the middleware below.
         */
        serializableCheck: false,
        /**
         * immutableCheck controls whether we get warnings about mutation of
         * state, which will be true in dev. However in test lavamoat complains
         * about something the middleware is doing. It would be good to figure
         * that out and enable this in test environments so that mutation
         * causes E2E failures.
         */
        immutableCheck: isDev
          ? {
              warnAfter: 100,
            }
          : false,
      }),
    devTools: false,
    enhancers,
    preloadedState,
  });
}
type Store = ReturnType<typeof configureStore>;
export type MetaMaskReduxState = ReturnType<Store['getState']>;
export type MetaMaskReduxDispatch = Store['dispatch'];
