import { DAPP_PATH } from '../../constants';

/**
 * Default options for setting up Tron E2E test environment
 */
export const DEFAULT_TRON_TEST_DAPP_FIXTURE_OPTIONS = {
  dappOptions: {
    customDappPaths: [DAPP_PATH.TEST_DAPP_TRON],
  },
};
