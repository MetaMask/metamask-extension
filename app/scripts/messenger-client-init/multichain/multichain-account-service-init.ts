import {
  MultichainAccountService,
  MultichainAccountServiceMessenger,
  SOL_ACCOUNT_PROVIDER_NAME,
  TRX_ACCOUNT_PROVIDER_NAME,
  BTC_ACCOUNT_PROVIDER_NAME,
  AccountProviderWrapper,
  XlmAccountProvider,
} from '@metamask/multichain-account-service';
import { MessengerClientInitFunction } from '../types';
import { MultichainAccountServiceInitMessenger } from '../messengers/accounts';
import { previousValueComparator } from '../../lib/util';
import {
  trace,
  type TraceCallback,
  type TraceRequest,
} from '../../../../shared/lib/trace';

// The account service starts these without a `parentContext`, so they nest
// under the active span; for group creation that is its own trace.
const NESTED_TRACE_NAMES = new Set<string>([
  'Provider Create Accounts (v2 - batched)',
  'Wallet Alignment',
]);

// Only the alignment a group creation runs afterwards is tagged `post`. The
// rest come from `alignAccounts()`, `alignAccountsOf()` or `discoverAccounts()`,
// which the service does not trace, so they start their own trace rather
// than nest under the active span.
function isStandaloneAlignment(request: TraceRequest) {
  return (request.name as string) === 'Wallet Alignment' && !request.data?.post;
}

function traceWithNestedFallback<ResultType>(
  request: TraceRequest,
  fn?: TraceCallback<ResultType>,
) {
  let req = request;
  if (isStandaloneAlignment(request)) {
    req = { ...request, root: true };
  } else if (NESTED_TRACE_NAMES.has(request.name)) {
    req = { ...request, allowActiveSpanFallback: true };
  }
  return fn ? trace(req, fn) : trace(req);
}

/**
 * Initialize the multichain account service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @param request.ensureOnboardingComplete - Ensure onboarding is complete before initializing.
 * @returns The initialized service.
 */
export const MultichainAccountServiceInit: MessengerClientInitFunction<
  MultichainAccountService,
  MultichainAccountServiceMessenger,
  MultichainAccountServiceInitMessenger
> = ({ controllerMessenger, initMessenger, ensureOnboardingComplete }) => {
  const snapAccountProviderConfig = {
    // READ THIS CAREFULLY:
    // We are using 1 to prevent any concurrent `keyring_createAccount` requests. This ensures
    // we prevent any desync between Snap's accounts and Metamask's accounts.
    maxConcurrency: 1,
    // Re-use the default config for the rest:
    discovery: {
      timeoutMs: 2000,
      maxAttempts: 3,
      backOffMs: 1000,
    },
    createAccounts: {
      timeoutMs: 3000,
    },
    resyncAccounts: {
      autoRemoveExtraSnapAccounts: false,
    },
  };

  // Stellar is GA; keep the custom provider until MultichainAccountService
  // wires XLM via `XLM_ACCOUNT_PROVIDER_NAME` like SOL/BTC/TRX.
  const xlmProvider = new AccountProviderWrapper(
    controllerMessenger,
    new XlmAccountProvider(controllerMessenger, snapAccountProviderConfig),
  );

  const messengerClient = new MultichainAccountService({
    messenger: controllerMessenger,
    providers: [xlmProvider],
    providerConfigs: {
      [SOL_ACCOUNT_PROVIDER_NAME]: snapAccountProviderConfig,
      [BTC_ACCOUNT_PROVIDER_NAME]: snapAccountProviderConfig,
      [TRX_ACCOUNT_PROVIDER_NAME]: snapAccountProviderConfig,
    },
    config: {
      // @ts-expect-error Controller uses string for names rather than enum
      trace: traceWithNestedFallback,
    },
    ensureOnboardingComplete,
  });

  const preferencesState = initMessenger.call('PreferencesController:getState');

  initMessenger.subscribe(
    'PreferencesController:stateChange',
    previousValueComparator((prevState, currState) => {
      const { useExternalServices: prevUseExternalServices } = prevState;
      const { useExternalServices: currUseExternalServices } = currState;
      if (prevUseExternalServices !== currUseExternalServices) {
        // Set basic functionality and trigger alignment when enabled
        // This single call handles both provider disable/enable and alignment.
        messengerClient
          .setBasicFunctionality(currUseExternalServices)
          .catch((error) => {
            console.error(
              'Failed to set basic functionality on MultichainAccountService:',
              error,
            );
          });
      }

      return true;
    }, preferencesState),
  );

  return {
    memStateKey: null,
    persistedStateKey: null,
    messengerClient,
  };
};
