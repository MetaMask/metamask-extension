/* eslint-disable require-unicode-regexp */
import SETTINGS_CONSTANTS from '../constants/settings';
import {
  getIsMetaMaskShieldFeatureEnabled,
  getIsSettingsPageDevOptionsEnabled,
} from '../../../shared/lib/environment';

let settingsRoutes;

const FEATURE_FLAG_CHECKERS = {
  METAMASK_SHIELD_ENABLED: getIsMetaMaskShieldFeatureEnabled,
  ENABLE_SETTINGS_PAGE_DEV_OPTIONS: getIsSettingsPageDevOptionsEnabled,
};

/**
 * Checks if a feature flag is enabled
 *
 * @param {string} featureFlag - The feature flag to check
 * @returns {boolean} Whether the feature flag is enabled
 */
function isFeatureFlagEnabled(featureFlag) {
  const checker = FEATURE_FLAG_CHECKERS[featureFlag];
  if (checker) {
    return checker();
  }

  console.warn(`Unknown feature flag: ${featureFlag}`);
  return false;
}

/** @returns {SettingRouteConfig[]} */
export function getSettingsRoutes() {
  if (settingsRoutes) {
    return settingsRoutes;
  }
  settingsRoutes = SETTINGS_CONSTANTS.filter((routeObject) => {
    return (
      (routeObject.featureFlag
        ? isFeatureFlagEnabled(routeObject.featureFlag)
        : true) && !routeObject.hidden
    );
  });
  return settingsRoutes;
}

/**
 * @param {Function} t - context.t function
 * @param {string} tabMessage
 * @returns {SettingRouteConfig[]}
 */
function getFilteredSettingsRoutes(t, tabMessage) {
  return getSettingsRoutes().filter((routeObject) => {
    return routeObject.tabMessage(t) === tabMessage;
  });
}

/**
 * @param {Function} t - context.t function
 * @param {string} tabMessage
 * @returns {number}
 */
export function getNumberOfSettingRoutesInTab(t, tabMessage) {
  return getFilteredSettingsRoutes(t, tabMessage).length;
}

export function handleSettingsRefs(t, tabMessage, settingsRefs) {
  const settingsSearchJsonFiltered = getFilteredSettingsRoutes(t, tabMessage);
  const settingsRefsIndex = settingsSearchJsonFiltered.findIndex(
    (routeObject) =>
      routeObject.route.substring(1) === window.location.hash.substring(1),
  );
  if (settingsRefsIndex === -1) {
    return;
  }

  const settingsRef =
    settingsSearchJsonFiltered.length === 1
      ? settingsRefs
      : settingsRefs[settingsRefsIndex];

  if (settingsRef?.current) {
    settingsRef.current.scrollIntoView({
      behavior: 'smooth',
    });
    settingsRef.current.focus();
    const historySettingsUrl = window.location.hash.split('#')[1];
    window.location.hash = historySettingsUrl;
  }
}
