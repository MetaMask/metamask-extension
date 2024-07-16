import { CaipAccountId, Hex, KnownCaipNamespace } from "@metamask/utils";
import { ScopesObject, parseScopeString } from "../scope";
import { validateAddEthereumChainParams } from "../../rpc-method-middleware/handlers/ethereum-chain-utils";
import { toHex } from "@metamask/controller-utils";
import { NetworkController } from "@metamask/network-controller";

export const assignAccountsToScopes = (scopes: ScopesObject, accounts: Hex[]) => {
  Object.keys(scopes).forEach((scope) => {
    if (scope !== 'wallet') {
      scopes[scope].accounts = accounts.map(
        (account) => `${scope}:${account}` as unknown as CaipAccountId, // do we need checks here?
      );
    }
  });

}

export const validateAndUpsertEip3085 = async (scopeString: string, eip3085Params: unknown, upsertNetworkConfiguration: NetworkController['upsertNetworkConfiguration']) => {
      if (!eip3085Params) {
        throw new Error('eip3085 params are missing')
      }

      const {namespace, reference} = parseScopeString(scopeString)

      if (!namespace || !reference) {
        throw new Error('scopeString is malformed')
      }

      if (namespace !== KnownCaipNamespace.Eip155) {
        throw new Error('scopeString namespace is not eip155')
      }

      const validParams = validateAddEthereumChainParams(eip3085Params);

      const {
        chainId,
        chainName,
        firstValidBlockExplorerUrl,
        firstValidRPCUrl,
        ticker,
      } = validParams;

      if (chainId !== toHex(reference)) {
        throw new Error('eip3085 chainId does not match reference in scopeString')
      }

      await upsertNetworkConfiguration(
        {
          chainId,
          rpcPrefs: { blockExplorerUrl: firstValidBlockExplorerUrl },
          nickname: chainName,
          rpcUrl: firstValidRPCUrl,
          ticker,
        },
        { source: 'dapp', referrer: origin },
      );
}
