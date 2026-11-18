import { ABTestVariant, type ABTestVariantName } from '../variants';

export const WIDE_SCREEN_REDESIGN_AB_KEY =
  'coreCEUX1492AbtestWideScreenRedesign';

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
