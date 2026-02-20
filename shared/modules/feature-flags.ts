import { Json } from '@metamask/utils';

export enum FeatureFlagNames {
  AssetsDefiPositionsEnabled = 'assetsDefiPositionsEnabled',
}

export const DEFAULT_FEATURE_FLAG_VALUES: Partial<
  Record<FeatureFlagNames, Json>
> = {
  [FeatureFlagNames.AssetsDefiPositionsEnabled]: true,
};
