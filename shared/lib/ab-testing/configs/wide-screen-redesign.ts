import { ABTestVariant, type ABTestVariantName } from '../variants';

export const WIDE_SCREEN_REDESIGN_AB_KEY =
  'coreCEUX1492AbtestWideScreenRedesign';

export const WIDE_SCREEN_REDESIGN_MIN_VERSION = '13.60.0';

export const WIDE_SCREEN_REDESIGN_REMOTE_FLAG = {
  versions: {
    [WIDE_SCREEN_REDESIGN_MIN_VERSION]: [
      {
        name: ABTestVariant.Treatment,
        scope: { type: 'threshold', value: 1 },
      },
    ],
  },
};

type WideScreenRedesignVariantConfig = {
  useWideLayout: boolean;
};

export const WIDE_SCREEN_REDESIGN_AB_TEST_VARIANTS: Record<
  ABTestVariantName,
  WideScreenRedesignVariantConfig
> = {
  [ABTestVariant.Control]: { useWideLayout: false },
  [ABTestVariant.Treatment]: { useWideLayout: true },
};

export const WIDE_SCREEN_REDESIGN_AB_TEST_EXPOSURE_METADATA = {
  experimentName: 'Wide Screen Redesign',
  variationNames: {
    [ABTestVariant.Control]: 'Current layout',
    [ABTestVariant.Treatment]: 'Wide screen redesign',
  } satisfies Record<ABTestVariantName, string>,
} as const;
