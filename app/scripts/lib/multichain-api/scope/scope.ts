import MetaMaskOpenRPCDocument from '@metamask/api-specs';
import {
  CaipChainId,
  CaipReference,
  CaipAccountId,
  isCaipNamespace,
  isCaipChainId,
  parseCaipChainId,
  KnownCaipNamespace,
} from '@metamask/utils';

export type NonWalletKnownCaipNamespace = Exclude<
  KnownCaipNamespace,
  KnownCaipNamespace.Wallet
>;

export const KnownWalletRpcMethods: string[] = [
  'wallet_registerOnboarding',
  'wallet_scanQRCode',
];
const WalletEip155Methods = [
  'wallet_addEthereumChain',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
];

const Eip155Methods = MetaMaskOpenRPCDocument.methods
  .map(({ name }) => name)
  .filter((method) => !WalletEip155Methods.includes(method))
  .filter((method) => !KnownWalletRpcMethods.includes(method));

export const KnownRpcMethods: Record<NonWalletKnownCaipNamespace, string[]> = {
  eip155: Eip155Methods,
};

export const KnownWalletNamespaceRpcMethods: Record<
  NonWalletKnownCaipNamespace,
  string[]
> = {
  eip155: WalletEip155Methods,
};

export const KnownNotifications: Record<NonWalletKnownCaipNamespace, string[]> =
  {
    eip155: ['accountsChanged', 'chainChanged', 'eth_subscription'],
  };

export type Scope = CaipChainId | CaipReference;

export type ScopeObject = {
  scopes?: CaipChainId[];
  methods: string[];
  notifications: string[];
  accounts?: CaipAccountId[];
  rpcDocuments?: string[];
  rpcEndpoints?: string[];
};

export type ScopesObject = Record<Scope, ScopeObject>;

export const parseScopeString = (
  scopeString: string,
): {
  namespace?: string;
  reference?: string;
} => {
  if (isCaipNamespace(scopeString)) {
    return {
      namespace: scopeString,
    };
  }
  if (isCaipChainId(scopeString)) {
    return parseCaipChainId(scopeString);
  }

  return {};
};

export type ScopedProperties = Record<Scope, Record<string, unknown>>;
