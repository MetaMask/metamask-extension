/* eslint-disable require-unicode-regexp */
import SETTINGS_CONSTANTS from '../constants/settings';
import {
  getIsMetaMaskShieldFeatureEnabled,
  getIsSettingsPageDevOptionsEnabled,
} from '../../../shared/modules/environment';

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

export function getSpecificSettingsRoute(t, tabMessage, sectionMessage) {
  return getSettingsRoutes().find((routeObject) => {
    return (
      routeObject.tabMessage(t) === tabMessage &&
      routeObject.sectionMessage(t) === sectionMessage
    );
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

export function colorText(menuElement, regex) {
  if (menuElement !== null) {
    let elemText = menuElement.innerHTML;
    elemText = elemText.replace('&amp;', '&');
    elemText = elemText.replace(
      /(<span class="settings-page__header__search__list__item__highlight">|<\/span>)/gim,
      '',
    );
    menuElement.innerHTML = elemText.replace(
      regex,
      '<span class="settings-page__header__search__list__item__highlight">$&</span>',
    );
  }
}

/**
 * Replaces any special characters in the input string that have a meaning in regular expressions
 * (such as \, *, +, ?, etc.) with their escaped versions (e.g., \ becomes \\).
 *
 * @param input - The input string to be escaped for use in a regular expression.
 * @returns The escaped string safe for use in a regular expression.
 */
export const escapeRegExp = (input) => {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special characters
};

export function highlightSearchedText() {
  const searchElem = document.getElementById('search-settings');
  const searchRegex = new RegExp(escapeRegExp(searchElem.value), 'gi');
  const results = document.querySelectorAll(
    '.settings-page__header__search__list__item',
  );

  [...results].forEach((element) => {
    const menuTabElement = element.querySelector(
      '.settings-page__header__search__list__item__tab',
    );
    const menuSectionElement = element.querySelector(
      '.settings-page__header__search__list__item__section',
    );

    colorText(menuTabElement, searchRegex);
    colorText(menuSectionElement, searchRegex);
  });
}
