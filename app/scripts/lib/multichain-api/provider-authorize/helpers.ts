import { CaipAccountId, Hex } from '@metamask/utils';
import {
  NetworkClientId,
  NetworkController,
} from '@metamask/network-controller';
import { ScopesObject, validateScopedPropertyEip3085 } from '../scope';

export const assignAccountsToScopes = (
  scopes: ScopesObject,
  accounts: Hex[],
) => {
  Object.keys(scopes).forEach((scope) => {
    if (scope !== 'wallet') {
      scopes[scope].accounts = accounts.map(
        (account) => `${scope}:${account}` as unknown as CaipAccountId, // do we need checks here?
      );
    }
  });
};

export const validateAndUpsertEip3085 = async ({
  scopeString,
  eip3085Params,
  origin,
  upsertNetworkConfiguration,
  findNetworkClientIdByChainId,
}: {
  scopeString: string;
  eip3085Params: unknown;
  origin: string;
  upsertNetworkConfiguration: NetworkController['upsertNetworkConfiguration'];
  findNetworkClientIdByChainId: NetworkController['findNetworkClientIdByChainId'];
}): Promise<undefined | NetworkClientId> => {
  const validParams = validateScopedPropertyEip3085(scopeString, eip3085Params);

  const {
    chainId,
    chainName,
    firstValidBlockExplorerUrl,
    firstValidRPCUrl,
    ticker,
  } = validParams;

  try {
    findNetworkClientIdByChainId(chainId as Hex)
    return undefined;
  } catch(err) {
    // noop
  }

  return upsertNetworkConfiguration(
    {
      chainId: chainId as Hex,
      rpcPrefs: { blockExplorerUrl: firstValidBlockExplorerUrl },
      nickname: chainName,
      rpcUrl: firstValidRPCUrl,
      ticker,
    },
    { source: 'dapp', referrer: origin },
  );
};
