/**
 * Vitest equivalent of test/integration/config/setupAfter.js.
 *
 * jest-preview is Jest-specific and is NOT ported here.  The CSS asset import
 * and nock baseline mock are preserved.
 */

import { vi, beforeEach } from 'vitest';
import nock from 'nock';
import { ACCOUNTS_API_BASE_URL } from '../../shared/constants/accounts';
import '../integration/config/assets/index.css';
import '../helpers/setup-after-helper';

beforeEach(() => {
  nock(ACCOUNTS_API_BASE_URL)
    .get('/v4/multiaccount/transactions')
    .query(true)
    .reply(200, { data: [], pageInfo: { hasNextPage: false, count: 0 } });

  nock(ACCOUNTS_API_BASE_URL)
    .persist()
    .get(/\/v1\/users\/.*\/surveys/u)
    .reply(200, { surveys: {} });
});

// Mock Pay-related components to avoid importing large dependency trees
vi.mock(
  '../../ui/pages/confirmations/components/confirm/info/perps-deposit-info',
  () => ({ PerpsDepositInfo: () => null }),
);

vi.mock(
  '../../ui/pages/confirmations/components/info/musd-conversion-info',
  () => ({ MusdConversionInfo: () => null }),
);

vi.mock(
  '../../ui/pages/confirmations/components/info/custom-amount-info',
  () => ({
    CustomAmountInfo: () => null,
    CustomAmountInfoSkeleton: () => null,
  }),
);
