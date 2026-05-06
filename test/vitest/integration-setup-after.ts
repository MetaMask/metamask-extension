/**
 * Vitest equivalent of test/integration/config/setupAfter.js.
 *
 * jest-preview and its generated CSS asset are Jest-specific and are NOT
 * ported here. The nock baseline mock is preserved.
 */

import { configure } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import nock from 'nock';
import { ACCOUNTS_API_BASE_URL } from '../../shared/constants/accounts';
import '../helpers/setup-after-helper';

configure({ asyncUtilTimeout: 5000 });

if (typeof window !== 'undefined') {
  window.cancelAnimationFrame ??= (() =>
    undefined) as typeof cancelAnimationFrame;
}

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
