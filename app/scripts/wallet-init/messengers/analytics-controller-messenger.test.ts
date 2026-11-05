import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getAnalyticsControllerInitMessenger } from './analytics-controller-messenger';

describe('getAnalyticsControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const analyticsControllerInitMessenger =
      getAnalyticsControllerInitMessenger(messenger);

    expect(analyticsControllerInitMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates the actions and events used by extension analytics helpers', () => {
    const messenger = getRootMessenger<never, never>();
    const delegateSpy = jest.spyOn(messenger, 'delegate');

    getAnalyticsControllerInitMessenger(messenger);

    expect(delegateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: [
          'PreferencesController:getState',
          'MultichainNetworkController:getState',
          'NetworkController:getState',
          'NetworkController:getNetworkClientById',
          'RemoteFeatureFlagController:getState',
          'AnalyticsController:getState',
          'AnalyticsController:trackEvent',
          'AnalyticsController:identify',
          'AnalyticsController:trackView',
          'AnalyticsController:optIn',
          'AnalyticsController:optInToMarketing',
          'AnalyticsController:optOut',
          'AnalyticsController:optOutOfMarketing',
          'AnalyticsController:resetConsentDecision',
          'AnalyticsController:setMarketingCampaignCookieId',
          'AnalyticsController:createEventFragment',
          'AnalyticsController:upsertEventFragment',
          'AnalyticsController:updateEventFragment',
          'AnalyticsController:getEventFragmentById',
          'AnalyticsController:finalizeEventFragment',
          'SentryTracingService:trackTracesAfterMetricsOptIn',
          'SentryTracingService:clearTracesAfterMetricsOptIn',
          'ConfigRegistryController:getState',
        ],
        events: ['ConfigRegistryController:stateChanged'],
      }),
    );
  });
});
