import { ABTestVariant } from '../variants';
import {
  WIDE_SCREEN_REDESIGN_AB_KEY,
  WIDE_SCREEN_REDESIGN_AB_TEST_EXPOSURE_METADATA,
  WIDE_SCREEN_REDESIGN_AB_TEST_VARIANTS,
} from './wide-screen-redesign';

describe('wide-screen-redesign config', () => {
  it('uses a compliant remote feature flag key', () => {
    expect(WIDE_SCREEN_REDESIGN_AB_KEY).toBe(
      'coreCEUX1492AbtestWideScreenRedesign',
    );
  });

  it('keeps the current bottom-nav design as control', () => {
    expect(WIDE_SCREEN_REDESIGN_AB_TEST_VARIANTS.control).toStrictEqual({
      useWideLayout: false,
    });
  });

  it('uses the side nav as treatment', () => {
    expect(WIDE_SCREEN_REDESIGN_AB_TEST_VARIANTS.treatment).toStrictEqual({
      useWideLayout: true,
    });
  });

  it('names both variants for exposure events', () => {
    expect(
      WIDE_SCREEN_REDESIGN_AB_TEST_EXPOSURE_METADATA.variationNames,
    ).toStrictEqual({
      [ABTestVariant.Control]: 'Bottom nav',
      [ABTestVariant.Treatment]: 'Side nav',
    });
  });
});
