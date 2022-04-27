import browser from 'webextension-polyfill';
import log from 'loglevel';

const returnToOnboardingInitiatorTab = async (onboardingInitiator) => {
  const tab = await browser.tabs.update(onboardingInitiator.tabId, {
    active: true,
  });

  if (tab) {
    window.close();
  } else {
    // this case can happen if the tab was closed since being checked with `browser.tabs.get`
    log.warn(
      `Setting current tab to onboarding initiator has failed; falling back to redirect`,
    );

    if (browser.runtime.lastError) {
      log.debug(browser.runtime.lastError);
    }
    window.location.assign(onboardingInitiator.location);
  }
};

export const returnToOnboardingInitiator = async (onboardingInitiator) => {
  const tab = await browser.tabs.get(onboardingInitiator.tabId);
  if (tab) {
    await returnToOnboardingInitiatorTab(onboardingInitiator);
  } else {
    if (browser.runtime.lastError) {
      log.debug(browser.runtime.lastError);
    }
    window.location.assign(onboardingInitiator.location);
  }
};
