import {
  CaipChainId,
  CaipReference,
  CaipAccountId,
  isCaipNamespace,
  isCaipChainId,
  parseCaipChainId,
} from '@metamask/utils';

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
