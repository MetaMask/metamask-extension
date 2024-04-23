import {
  CaipChainId,
  isCaipChainId,
  isCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';

// {scopeString} (conditional) = EITHER a namespace identifier string registered in the CASA namespaces registry to authorize multiple chains with identical properties OR a single, valid [CAIP-2][] identifier, i.e., a specific chain_id within a namespace.
// scopes (conditional) = An array of 0 or more [CAIP-2][] chainIds. For each entry in scopes, all the other properties of the scopeObject apply, but in some cases, such as when members of accounts are specific to 1 or more chains in scopes, they may be ignored or filtered where inapplicable; namespace-specific rules for organizing or interpreting properties in multi-scope MAY be specified in a namespace-specific profile of this specification.
//  This property MUST NOT be present if the object is already scoped to a single chainId in the string value above.
//  This property MUST NOT be present if the scope is an entire namespace in which chainIds are not defined.
//  This property MAY be present if the scope is an entire namespace in which chainIds are defined.
// methods = An array of 0 or more JSON-RPC methods that an application can call on the agent and/or an agent can call on an application.
// notifications = An array of 0 or more JSON-RPC notifications that an application send to or expect from the agent.
// accounts (optional) = An array of 0 or more CAIP-10 identifiers, each valid within the scope of authorization.
// rpcDocuments (optional) = An array of URIs that each dereference to an RPC document specifying methods and notifications applicable in this scope.
// These are ordered from most authoritative to least, i.e. methods defined more than once by the union of entries should be defined by their earliest definition only.
// rpcEndpoints (optional) = An array of URLs that each dereference to an RPC endpoints for routing requests within this scope.
// These are ordered from most authoritative to least, i.e. priority SHOULD be given to endpoints in the order given, as per the CAIP-211 profile for that namespace, if one has been specified.

//     "eip155": {
//       "scopes": ["eip155:1", "eip155:137"],
//       "methods": ["eth_sendTransaction", "eth_signTransaction", "eth_sign", "get_balance", "personal_sign"],
//       "notifications": ["accountsChanged", "chainChanged"]
//     },

export type ScopeObject = {
  scopes?: CaipChainId[]; // CaipChainId[]
  methods: string[];
  notifications: string[];
  accounts?: string[]; // CaipAccountId
  rpcDocuments?: string[];
  rpcEndpoints?: string[];
};

// Make this an assert
export const isValidScope = (
  scopeString: string,
  scopeObject: ScopeObject,
): boolean => {
  const isNamespaceScoped = isCaipNamespace(scopeString);
  const isChainScoped = isCaipChainId(scopeString);

  if (!isNamespaceScoped && !isChainScoped) {
    return false;
  }

  const {
    scopes,
    methods,
    notifications,
    accounts,
    rpcDocuments,
    rpcEndpoints,
    ...restScopeObject
  } = scopeObject;

  // These assume that the namespace has a notion of chainIds
  if (isChainScoped && scopes) {
    // TODO: Probably requires refactoring this helper a bit
    // When a badly-formed request includes a chainId mismatched to scope
    //   code = 5203
    //   message = "Scope/chain mismatch"
    // When a badly-formed request defines one chainId two ways
    //  code = 5204
    //  message = "ChainId defined in two different scopes"
    return false;
  }
  if (isNamespaceScoped && scopes) {
    const namespace = scopeString;
    const areScopesValid = scopes.every((scope) => {
      try {
        return parseCaipChainId(scope).namespace === namespace;
      } catch (e) {
        // parsing caipChainId failed
        console.log(e);
        return false;
      }
    });

    if (!areScopesValid) {
      return false;
    }
  }

  const areMethodsValid = methods.every(
    (method) => typeof method === 'string' && method !== '',
  );
  if (!areMethodsValid) {
    return false;
  }

  const areNotificationsValid = notifications.every(
    (notification) => typeof notification === 'string' && notification !== '',
  );
  if (!areNotificationsValid) {
    return false;
  }

  // not validating rpcDocuments or rpcEndpoints currently

  // unexpected properties found on scopeObject
  if (Object.keys(restScopeObject).length !== 0) {
    return false;
  }

  return true;
};

// This doesn't belong here
export const isSupportedNotification = (notification: string): boolean => {
  return ['accountsChanged', 'chainChanged'].includes(notification);
};

// TODO: Remove this after bumping utils
enum KnownCaipNamespace {
  /** EIP-155 compatible chains. */
  Eip155 = 'eip155',
  Wallet = 'wallet', // Needs to be added to utils
}

const isKnownCaipNamespace = (
  namespace: string,
): namespace is KnownCaipNamespace => {
  return Object.values(KnownCaipNamespace).includes(
    namespace as KnownCaipNamespace,
  );
};

export const isSupportedScopeString = (scopeString: string) => {
  const isNamespaceScoped = isCaipNamespace(scopeString);
  const isChainScoped = isCaipChainId(scopeString);

  if (isNamespaceScoped) {
    return isKnownCaipNamespace(scopeString);
  }

  if (isChainScoped) {
    return isKnownCaipNamespace(parseCaipChainId(scopeString).namespace);
  }

  return false;
};
