require('../../env');
// We force the multichain accounts feature flag to be enabled in all integration tests. This
// way we don't need to mock remote feature flag service calls.
// TODO: Remove this env var once the feature flag has been fully removed!
process.env.FORCE_MULTICHAIN_ACCOUNTS_FEATURE_FLAG = 'true';
