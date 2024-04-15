import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import { isValidScope } from './caip-25';

// {
//   "requiredScopes": {
//     "eip155": {
//       "scopes": ["eip155:1", "eip155:137"],
//       "methods": ["eth_sendTransaction", "eth_signTransaction", "eth_sign", "get_balance", "personal_sign"],
//       "notifications": ["accountsChanged", "chainChanged"]
//     },
//     "eip155:10": {
//       "methods": ["get_balance"],
//       "notifications": ["accountsChanged", "chainChanged"]
//     },
//     "wallet": {
//       "methods": ["wallet_getPermissions", "wallet_creds_store", "wallet_creds_verify", "wallet_creds_issue", "wallet_creds_present"],
//       "notifications": []
//     },
//     "cosmos": {
//       ...
//     }
//   },
//   "optionalScopes":{
//     "eip155:42161": {
//       "methods": ["eth_sendTransaction", "eth_signTransaction", "get_balance", "personal_sign"],
//       "notifications": ["accountsChanged", "chainChanged"]
//   },
//   "sessionProperties": {
//     "expiry": "2022-12-24T17:07:31+00:00",
//     "caip154-mandatory": "true"
//   }
// }

const providerAuthorize = {
  methodNames: [MESSAGE_TYPE.PROVIDER_AUTHORIZE],
  implementation: providerAuthorizeHandler,
  hookNames: {
    getAccounts: true,
  },
};
export default providerAuthorize;

async function providerAuthorizeHandler(_req, res, _next, end, _hooks) {
  const { requiredScopes, optionalScopes, sessionProperties } = _req.params;

  const sessionId = '0xdeadbeef';

  const validRequiredScopes = {};
  for (const [scopeString, scopeObject] of Object.entries(requiredScopes)) {
    if (isValidScope(scopeString, scopeObject)) {
      validRequiredScopes[scopeString] = {
        accounts: [],
        ...scopeObject,
      };
    }
  }
  if (requiredScopes && Object.keys(validRequiredScopes).length === 0) {
    throw new Error(
      '`requiredScopes` object MUST contain 1 more `scopeObjects`, if present',
    );
  }

  const validOptionalScopes = {};
  for (const [scopeString, scopeObject] of Object.entries(optionalScopes)) {
    if (isValidScope(scopeString, scopeObject)) {
      validOptionalScopes[scopeString] = {
        accounts: [],
        ...scopeObject,
      };
    }
  }
  if (optionalScopes && Object.keys(validOptionalScopes).length === 0) {
    throw new Error(
      '`optionalScopes` object MUST contain 1 more `scopeObjects`, if present',
    );
  }

  const randomSessionProperties = {}; // session properties do not have to be honored by the wallet
  for (const [key, value] of Object.entries(sessionProperties)) {
    if (Math.random() > 0.5) {
      randomSessionProperties[key] = value;
    }
  }
  if (sessionProperties && Object.key(sessionProperties).length === 0) {
    throw new Error(
      '`sessionProperties` object MUST contain 1 or more properties if present',
    );
  }

  res.result = {
    sessionId,
    sessionScopes: {
      // what happens if these keys collide?
      ...validRequiredScopes,
      ...validOptionalScopes,
    },
    sessionProperties: {
      expiry: '2022-11-31T17:07:31+00:00',
    },
  };
  return end();
}
