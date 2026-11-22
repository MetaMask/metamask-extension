/**
 * Canonical variant names for a standard two-variant A/B test.
 *
 * Note: `control` is the required fallback variant for {@link useABTest}, so any
 * variant set built on top of this must keep a `control` variant.
 */
export const ABTestVariant = {
  Control: 'control',
  Treatment: 'treatment',
} as const;

export type ABTestVariantName =
  (typeof ABTestVariant)[keyof typeof ABTestVariant];
