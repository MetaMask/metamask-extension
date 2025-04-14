/* eslint-disable require-unicode-regexp */
import SETTINGS_CONSTANTS from '../constants/settings';

let settingsRoutes;

/** @returns {SettingRouteConfig[]} */
export function getSettingsRoutes() {
  if (settingsRoutes) {
    return settingsRoutes;
  }
  settingsRoutes = SETTINGS_CONSTANTS.filter(
    (routeObject) =>
      (routeObject.featureFlag ? process.env[routeObject.featureFlag] : true) &&
      !routeObject.hidden,
  );
  return settingsRoutes;
}

/**
 * @param {Function} t - context.t function
 * @param {string} tabMessage
 * @returns {SettingRouteConfig[]}
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
// eslint-disable-next-line id-length
function getFilteredSettingsRoutes(t, tabMessage) {
  return getSettingsRoutes().filter((routeObject) => {
    return routeObject.tabMessage(t) === tabMessage;
  });
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
// eslint-disable-next-line id-length
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
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
// eslint-disable-next-line id-length
export function getNumberOfSettingRoutesInTab(t, tabMessage) {
  return getFilteredSettingsRoutes(t, tabMessage).length;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
// eslint-disable-next-line id-length
export function handleSettingsRefs(t, tabMessage, settingsRefs) {
  const settingsSearchJsonFiltered = getFilteredSettingsRoutes(t, tabMessage);
  const settingsRefsIndex = settingsSearchJsonFiltered.findIndex(
    (routeObject) =>
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    const historySettingsUrl = window.location.hash.split('#')[1];
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  const searchElem = document.getElementById('search-settings');
  const searchRegex = new RegExp(escapeRegExp(searchElem.value), 'gi');
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
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
