import {
  CaipChainId,
  CaipReference,
  CaipAccountId,
  isCaipNamespace,
  isCaipChainId,
  parseCaipChainId,
} from '@metamask/utils';

// TODO: Remove this after bumping utils
export enum KnownCaipNamespace {
  /** EIP-155 compatible chains. */
  Eip155 = 'eip155',
  Wallet = 'wallet', // Needs to be added to utils
}

export type Scope = CaipChainId | CaipReference;

export type ExternalScopeObject = InternalScopeObject & {
  scopes?: CaipChainId[];
};

export type InternalScopeObject = {
  methods: string[];
  notifications: string[];
  accounts?: CaipAccountId[];
  rpcDocuments?: string[];
  rpcEndpoints?: string[];
};

export type ExternalScopesObject = Record<Scope, ExternalScopeObject>;

export type InternalScopesObject = Record<CaipChainId, InternalScopeObject>;

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
