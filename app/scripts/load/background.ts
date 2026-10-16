// currently only used in webpack build.

// MV2 has no DNR authority. Its existing startup behavior stays available while
// Firefox network-policy enforcement remains a separate follow-up.
import {
  networkPolicyBootstrapReady,
  networkPolicyEnforcement,
} from '../lib/install-network-policy';

async function loadBackground(): Promise<void> {
  await networkPolicyBootstrapReady;
  const { startBackground } = await import('../background');
  await startBackground(networkPolicyEnforcement);

  if (process.env.IN_TEST) {
    document.documentElement.classList.add('metamask-loaded');
  }
}

loadBackground().catch(console.error);
