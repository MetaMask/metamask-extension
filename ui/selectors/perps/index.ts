/**
 * Perps selectors
 *
 * This directory contains Redux selectors for the Perps trading feature.
 *
 * @see {@link https://github.com/MetaMask/metamask-extension} for more info
 */

export {
  getIsPerpsExperienceAvailable,
  getIsPerpsTerminalBackendEnabled,
  getHip3AllowedSources,
  getHip3AllowedSourcesSet,
} from './feature-flags';

export { getPerpsTabBadgeSeen } from './persisted-state';
