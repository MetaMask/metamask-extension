/**
 * Prod entrypoint for network native-logo/native-token verification.
 *
 * This wrapper keeps command compatibility for:
 * NETWORKS="bob,etherlink,Chiliz,Ink,Mantle" yarn test:e2e:single ...import-network-native-logo-prod.spec.ts
 */
import './import-custom-networks-native-tokens.spec';
