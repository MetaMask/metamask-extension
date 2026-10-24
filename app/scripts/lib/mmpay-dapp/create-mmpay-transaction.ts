import { isEvmAccountType } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import type { Hex } from '@metamask/utils';

import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import {
  addTransaction,
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
 * Adds an MMPay transaction from an internal MetaMask entry point.
 *
 * @param deps - Transaction dependencies and selected sender address.
 * @param rawParams - Raw MMPay params from the deeplink route.
 * @returns The created transaction ID.
 */
export async function addMmPayInternalTransaction(
  deps: CommonDeps & { from: Hex },
  rawParams: unknown,
): Promise<{ transactionId: string }> {
  const { base, builtTx } = await prepare(deps, rawParams, deps.from);

  const transactionMeta = await addTransaction({
    ...base,
    transactionOptions: {
      networkClientId: base.networkClientId,
      origin: ORIGIN_METAMASK,
      type: builtTx.type,
      skipInitialGasEstimate: builtTx.skipInitialGasEstimate,
      isInternal: true,
      requireApproval: true,
    },
    waitForSubmit: false,
  });

  return { transactionId: transactionMeta.id };
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
