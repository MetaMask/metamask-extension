/* eslint-disable require-unicode-regexp */
import { SETTINGS_CONSTANTS } from '../constants/settings';

let settingsRoutes;

export function getSettingsRoutes() {
  if (settingsRoutes) {
    return settingsRoutes;
  }
  settingsRoutes = SETTINGS_CONSTANTS.filter((routeObject) =>
    routeObject.featureFlag ? process.env[routeObject.featureFlag] : true,
  );
  return settingsRoutes;
}

function getFilteredSettingsRoutes(t, tabMessage) {
  return getSettingsRoutes().filter((routeObject) => {
    return routeObject.tabMessage(t) === tabMessage;
  });
}

export function getNumberOfSettingsInSection(t, tabMessage) {
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

function colorText(menuElement, regex) {
  if (menuElement !== null) {
    let elemText = menuElement.innerHTML;
    elemText = elemText.replace('&amp;', '&');
    elemText = elemText.replace(
      /(<span style="background:#ffd33d">|<\/span>)/gim,
      '',
    );
    menuElement.innerHTML = elemText.replace(
      regex,
      '<span style="background:#ffd33d">$&</span>',
    );
  }
}

export function highlightSearchedText() {
  const searchElem = document.getElementById('search-settings');
  const searchRegex = new RegExp(searchElem.value, 'gi');
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
