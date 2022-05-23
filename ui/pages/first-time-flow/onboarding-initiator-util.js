import browser from 'webextension-polyfill';
import log from 'loglevel';

export const returnToOnboardingInitiatorTab = async (onboardingInitiator) => {
  let tab;
  try {
    tab = await browser.tabs.update(onboardingInitiator.id, {
      active: true,
    });
  } catch (error) {
    log.debug(
      `An error occurred while updating tabs in returnToOnboardingInitiatorTab: ${error.message}`,
    );
  }

  if (tab) {
    window.close();
  } else {
    // this case can happen if the tab was closed since being checked with `browser.tabs.get`
    log.warn(
      `Setting current tab to onboarding initiator has failed; falling back to redirect`,
    );

    window.location.assign(onboardingInitiator.location);
  }
};
