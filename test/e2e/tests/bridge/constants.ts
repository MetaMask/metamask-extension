import { FeatureFlagResponse } from '../../../../ui/pages/bridge/bridge.util';

export const DEFAULT_FEATURE_FLAGS_RESPONSE: FeatureFlagResponse = {
  'extension-support': false,
};

export const LOCATOR = {
  MM_IMPORT_TOKENS_MODAL: (suffix: string) =>
    `[data-testid="import-tokens-modal-${suffix}"]`,
};
