import {
  MUSD_EVENTS_CONSTANTS,
  musdConversionFlowEntryPointToCtaEventLocation,
  resolveMusdConversionCtaRedirectsTo,
} from './musd-events';

describe('resolveMusdConversionCtaRedirectsTo', () => {
  it('returns buy_screen for buy intent', () => {
    expect(resolveMusdConversionCtaRedirectsTo({ intent: 'buy' })).toBe(
      MUSD_EVENTS_CONSTANTS.REDIRECT_DESTINATIONS.BUY_SCREEN,
    );
  });

  it('returns conversion_education_screen when conversion and education not seen', () => {
    expect(
      resolveMusdConversionCtaRedirectsTo({
        intent: 'conversion',
        educationSeen: false,
      }),
    ).toBe(
      MUSD_EVENTS_CONSTANTS.REDIRECT_DESTINATIONS.CONVERSION_EDUCATION_SCREEN,
    );
  });

  it('returns custom_amount_screen when conversion and education seen', () => {
    expect(
      resolveMusdConversionCtaRedirectsTo({
        intent: 'conversion',
        educationSeen: true,
      }),
    ).toBe(MUSD_EVENTS_CONSTANTS.REDIRECT_DESTINATIONS.CUSTOM_AMOUNT_SCREEN);
  });
});

describe('musdConversionFlowEntryPointToCtaEventLocation', () => {
  it('maps home to home_screen', () => {
    expect(musdConversionFlowEntryPointToCtaEventLocation('home')).toBe(
      MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.HOME_SCREEN,
    );
  });

  it('maps token_list to token_list_item', () => {
    expect(musdConversionFlowEntryPointToCtaEventLocation('token_list')).toBe(
      MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.TOKEN_LIST_ITEM,
    );
  });

  it('maps asset_overview to asset_overview', () => {
    expect(
      musdConversionFlowEntryPointToCtaEventLocation('asset_overview'),
    ).toBe(MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.ASSET_OVERVIEW);
  });
});
