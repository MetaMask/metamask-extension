import { MiddlewareContext } from '@metamask/json-rpc-engine/v2';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import type { Hex, JsonRpcRequest } from '@metamask/utils';

import {
  addDappTransaction,
  type AddTransactionMessenger,
} from '../transaction/util';
import { MMPAY_REGISTRY } from './registry';
import { toAmountRaw, validateMmPayParams } from './validate-params';

type CommonDeps = {
  messenger: AddTransactionMessenger;
  securityAlertsEnabled: boolean;
  ensureNetwork: (chainId: Hex) => Promise<string>;
};

type MmPayMessengerCall = {
  (action: 'RemoteFeatureFlagController:getState'): {
    remoteFeatureFlags?: Record<string, unknown>;
  };
  (
    action: 'AccountsController:getAccountByAddress',
    address: Hex,
  ): InternalAccount | undefined;
  (action: 'AccountsController:listAccounts'): InternalAccount[];
  (
    action: 'NetworkController:getNetworkConfigurationByNetworkClientId',
    networkClientId: string,
  ): { chainId: Hex };
};

/**
 * Adds an MMPay transaction from the dApp RPC flow.
 *
 * @param deps - Transaction dependencies and dApp request metadata.
 * @param rawParams - Raw MMPay params from the JSON-RPC request.
 * @returns The submitted transaction hash.
 */
export async function addMmPayDappTransaction(
  deps: CommonDeps & {
    from: Hex;
    dappRequest: JsonRpcRequest & {
      origin?: string;
      securityAlertResponse?: unknown;
      traceContext?: unknown;
    };
  },
  rawParams: unknown,
): Promise<string> {
  const { dappRequest, from } = deps;
  const { base, builtTx } = await prepare(deps, rawParams, from);
  const requestContext = new MiddlewareContext<Record<PropertyKey, unknown>>({
    origin: dappRequest.origin,
    securityAlertResponse: dappRequest.securityAlertResponse,
    traceContext: dappRequest.traceContext,
  });

  return await addDappTransaction({
    ...base,
    transactionOptions: {
      type: builtTx.type,
      skipInitialGasEstimate: builtTx.skipInitialGasEstimate,
    },
    dappRequest,
    requestContext,
  });
}

async function prepare(deps: CommonDeps, rawParams: unknown, from: Hex) {
  const { messenger, securityAlertsEnabled, ensureNetwork } = deps;
  const call = messenger.call as unknown as MmPayMessengerCall;
  const params = validateMmPayParams(rawParams);
  const def = MMPAY_REGISTRY[params.type];

  if (def.isAvailable) {
    const flags =
      call('RemoteFeatureFlagController:getState').remoteFeatureFlags ?? {};
    if (!def.isAvailable(flags as Record<string, unknown>)) {
      throw rpcErrors.methodNotSupported({
        message: `${params.type} is not available`,
      });
    }
  }

  const amountRaw = toAmountRaw(params.amount, def.tokenDecimals);
  const builtTx = def.build({ from, amountRaw });
  const networkClientId = await ensureNetwork(builtTx.chainId);
  const selectedAccount = call('AccountsController:getAccountByAddress', from);

  if (!selectedAccount || !isEvmAccountType(selectedAccount.type)) {
    throw providerErrors.unauthorized({ message: 'EVM account required' });
  }

  const internalAccounts = call('AccountsController:listAccounts');
  const { chainId } = call(
    'NetworkController:getNetworkConfigurationByNetworkClientId',
    networkClientId,
  );

  return {
    base: {
      messenger,
      internalAccounts,
      selectedAccount,
      networkClientId,
      chainId,
      transactionParams: builtTx.txParams,
      securityAlertsEnabled,
    },
    builtTx,
  };
}
