import { createNetworkPolicyEnforcement } from './network-policy-enforcement';

// Import this before any application dependencies in each background entry.
// The handle is passed into the wrapped background module through its exports;
// it is never attached to the real global or exposed through runtime messaging.
const { chrome: extension, fetch: fetchResource } = globalThis;
const fetchPackagedResource = fetchResource.bind(globalThis);
const isMv3 = extension.runtime.getManifest().manifest_version === 3;
export const networkPolicyEnforcement = isMv3
  ? createNetworkPolicyEnforcement({
      extensionId: extension.runtime.id,
      declarativeNetRequest: {
        isRegexSupported: extension.declarativeNetRequest.isRegexSupported.bind(
          extension.declarativeNetRequest,
        ),
        getSessionRules: extension.declarativeNetRequest.getSessionRules.bind(
          extension.declarativeNetRequest,
        ),
        updateSessionRules:
          extension.declarativeNetRequest.updateSessionRules.bind(
            extension.declarativeNetRequest,
          ),
      },
    })
  : undefined;

// Do not load application consumers until stale grants have been removed.
export const networkPolicyBootstrapReady = (async () => {
  if (!networkPolicyEnforcement) {
    return;
  }
  await networkPolicyEnforcement.update({
    mode: 'blocked',
    allowedDomains: [],
    allowedRpcUrls: [],
  });
  if (isMv3) {
    const response = await fetchPackagedResource(
      extension.runtime.getURL('network-policy-rules.json'),
    );
    const rules: chrome.declarativeNetRequest.Rule[] = await response.json();
    const denies = rules.filter(({ action }) => action.type === 'block');
    if (
      !response.ok ||
      denies.length !== 2 ||
      !denies.every(({ condition }) => {
        const domains = condition.initiatorDomains ?? condition.topDomains;
        return domains?.length === 1 && domains[0] === extension.runtime.id;
      })
    ) {
      throw new Error(
        'Packaged network policy does not match this extension installation',
      );
    }
  }
})();
